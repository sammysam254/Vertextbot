import { Telegraf, Markup } from 'telegraf';
import { getMerchant, getAllMerchants, getPendingWithdrawals, getAllInvoices, getInvoicesByMerchant } from '../supabase';
import { CONFIG } from '../config';

export function isAdmin(userId: number): boolean {
  return String(userId) === String(CONFIG.ADMIN_CHAT_ID);
}

const MERCHANT_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Products'],
  ['Store Orders', 'My Store'],
  ['Export CSV', 'Dashboard'],
  ['API Settings', 'Help'],
]).resize();

const ADMIN_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Products'],
  ['Store Orders', 'My Store'],
  ['Admin Dashboard', 'Export CSV'],
  ['Dashboard', 'Help'],
]).resize();

const CUSTOMER_KB = Markup.keyboard([
  ['Register as Merchant'],
  ['Browse Stores', 'My Cart'],
  ['Help'],
]).resize();

export async function sendMainMenu(ctx: any, userId: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  const admin = isAdmin(userId);
  const merchantAppUrl = CONFIG.WEBHOOK_DOMAIN + '/merchant-app';

  if (admin) {
    return ctx.reply('Admin Panel - Vertext Bot', {
      ...ADMIN_KB,
      ...Markup.inlineKeyboard([[Markup.button.webApp('Open Merchant Dashboard', merchantAppUrl)]]),
    });
  }

  if (merchant?.payout_address) {
    const slug = (merchant as any).store_slug || merchant.telegram_id;
    const storeUrl = CONFIG.WEBHOOK_DOMAIN + '/store?m=' + slug;
    return ctx.reply('Vertext Escrow Bot\n\nWelcome back! Use the menu below:', {
      ...MERCHANT_KB,
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('Open Merchant Dashboard', merchantAppUrl)],
        [Markup.button.url('View My Store', storeUrl)],
      ]),
    });
  }

  return ctx.reply('Vertext Escrow Bot\n\nSecure crypto escrow & invoicing.', { ...CUSTOMER_KB });
}

export function registerMenuHandlers(bot: Telegraf) {
  bot.command('menu', async (ctx) => { await sendMainMenu(ctx, ctx.from!.id); });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await sendMainMenu(ctx, ctx.from!.id);
  });

  // ── My Wallet ──────────────────────────────────────────────────────────────
  bot.hears('My Wallet', async (ctx) => {
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.', { ...Markup.inlineKeyboard([[Markup.button.callback('Register', 'register_merchant')]]) });
    const { getNetworkFee, calcFees } = await import('../nowpayments');
    const networkFee = await getNetworkFee(merchant.payout_network as any);
    const { totalFee } = calcFees(networkFee);
    const locked = Number((merchant as any).locked_amount ?? 0);
    await ctx.reply(
      'My Wallet\n\nAvailable: $' + Number(merchant.internal_balance).toFixed(4) + ' USDT' +
      (locked > 0 ? '\nLocked: $' + locked.toFixed(4) : '') +
      '\nNetwork: ' + merchant.payout_network +
      '\nAddress: ' + merchant.payout_address +
      '\nFee per withdrawal: ~$' + totalFee.toFixed(4),
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Deposit', 'wallet_deposit'), Markup.button.callback('Withdraw', 'wallet_withdraw')],
        [Markup.button.callback('Refresh Balance', 'wallet_menu')],
      ])}
    );
  });

  // ── Create Invoice ─────────────────────────────────────────────────────────
  bot.hears('Create Invoice', async (ctx) => {
    const { invoiceSession } = await import('./invoiceMenu');
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.', { ...Markup.inlineKeyboard([[Markup.button.callback('Register', 'register_merchant')]]) });
    invoiceSession.set(ctx.from!.id, { step: 'AWAITING_AMOUNT' });
    await ctx.reply('Create Invoice - Step 1 of 2\n\nReply with amount in USD (e.g. 50.00):', { ...Markup.inlineKeyboard([[Markup.button.callback('Cancel', 'back_to_menu')]]) });
  });

  // ── My Invoices ────────────────────────────────────────────────────────────
  bot.hears('My Invoices', async (ctx) => {
    const invoices = await getInvoicesByMerchant(ctx.from!.id, 10).catch(() => []);
    if (!invoices.length) return ctx.reply('No invoices yet.', { ...Markup.inlineKeyboard([[Markup.button.callback('Create Invoice', 'invoice_start')]]) });
    const buttons = invoices.map((inv: any) => [
      Markup.button.callback((inv.status === 'PAID' ? 'PAID' : inv.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING') + ' $' + Number(inv.amount_fiat).toFixed(2) + ' - ' + inv.description.slice(0, 18), 'view_invoice_' + inv.invoice_id)
    ]);
    buttons.push([Markup.button.callback('New Invoice', 'invoice_start')]);
    await ctx.reply('My Invoices:', { ...Markup.inlineKeyboard(buttons) });
  });

  // ── My Products ────────────────────────────────────────────────────────────
  bot.hears('My Products', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const { getMerchantProducts } = await import('../shop/shopDb');
    const prods = await getMerchantProducts(userId).catch(() => []);
    if (!prods.length) return ctx.reply('No products yet. Use /add_product to create your first!',
      { ...Markup.inlineKeyboard([[Markup.button.callback('+ Add Product', 'start_add_product')]]) });
    const buttons = prods.slice(0, 8).map((p: any) => [
      Markup.button.callback((p.is_active ? '✅' : '⛔') + ' ' + p.name.slice(0, 22) + ' $' + Number(p.price_usd).toFixed(2), 'toggle_product_' + p.product_id)
    ]);
    buttons.push([Markup.button.callback('+ Add Product', 'start_add_product'), Markup.button.callback('View All', 'products_page_0')]);
    await ctx.reply('My Products (' + prods.length + ' total):', { ...Markup.inlineKeyboard(buttons) });
  });

  // ── Store Orders ───────────────────────────────────────────────────────────
  bot.hears('Store Orders', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const { getMerchantOrders } = await import('../shop/shopDb');
    const orders = await getMerchantOrders(userId, 15).catch(() => []);
    if (!orders.length) return ctx.reply('No store orders yet.\n\nShare your store link with customers to start selling!');
    const icons: Record<string, string> = { PENDING: '⏳', PAID: '✅', SHIPPED: '📦', CANCELLED: '❌' };
    const text = 'Store Orders (' + orders.length + ')\n\n' +
      orders.map((o: any) => icons[o.status] + ' $' + Number(o.total_amount_usd).toFixed(2) + ' ' + o.status + ' #' + o.order_id.slice(0, 8)).join('\n');
    const shipBtns = orders.filter((o: any) => o.status === 'PAID').map((o: any) => [Markup.button.callback('📦 Ship #' + o.order_id.slice(0, 8), 'ship_order_' + o.order_id)]);
    await ctx.reply(text, { ...Markup.inlineKeyboard(shipBtns) });
  });

  // ── My Store ───────────────────────────────────────────────────────────────
  bot.hears('My Store', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const slug = (merchant as any).store_slug || merchant.telegram_id;
    const storeUrl = CONFIG.WEBHOOK_DOMAIN + '/store?m=' + slug;
    const storeName = (merchant as any).store_name || 'My Store';
    const storeBio = (merchant as any).store_bio || 'Not set';
    await ctx.reply(
      'My Store\n\n' +
      'Name: ' + storeName + '\n' +
      'Bio: ' + storeBio + '\n' +
      'Slug: ' + ((merchant as any).store_slug || 'Not set') + '\n\n' +
      'Store URL:\n' + storeUrl + '\n\n' +
      'Share this URL with customers to let them browse and buy your products!\n\n' +
      'Commands:\n/set_slug yourslug - Set custom URL\n/set_storename Name - Set store name\n/set_storebio Description - Set bio',
      {
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard([
          [Markup.button.url('Open My Store', storeUrl)],
          [Markup.button.callback('My Products', 'products_page_0')],
        ])
      }
    );
  });

  // ── Export CSV ─────────────────────────────────────────────────────────────
  bot.hears('Export CSV', async (ctx) => {
    const userId = ctx.from!.id;
    await ctx.reply('Generating your 30-day report...');
    const { supabase } = await import('../supabase');
    const since = new Date(); since.setDate(since.getDate() - 30);
    const [invRes, wdRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('merchant_id', userId).gte('created_at', since.toISOString()),
      supabase.from('withdrawals').select('*').eq('merchant_id', userId).gte('created_at', since.toISOString()),
    ]);
    const invoices = invRes.data ?? [];
    const withdrawals = wdRes.data ?? [];
    if (!invoices.length && !withdrawals.length) return ctx.reply('No data found for the last 30 days.');
    const { Parser } = await import('json2csv');
    const lines = [
      'VERTEXT ACCOUNTING EXPORT - ' + new Date().toUTCString(), 'Period: Last 30 days', '',
      '=== INVOICES ===',
      invoices.length ? new Parser({ fields: ['invoice_id', 'description', 'amount_fiat', 'status', 'paid_currency', 'txid', 'created_at'] }).parse(invoices) : 'None',
      '', '=== WITHDRAWALS ===',
      withdrawals.length ? new Parser({ fields: ['withdrawal_id', 'amount_requested', 'fee_deducted', 'net_payout', 'status', 'created_at'] }).parse(withdrawals) : 'None',
    ].join('\n');
    const csv = Buffer.from(lines, 'utf-8');
    await ctx.replyWithDocument({ source: csv, filename: 'vertext_export_' + userId + '_' + new Date().toISOString().slice(0, 10) + '.csv' }, { caption: 'Accounting Export\nInvoices: ' + invoices.length + ' | Withdrawals: ' + withdrawals.length });
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────
  bot.hears('Dashboard', async (ctx) => {
    await ctx.reply('Open your dashboard:', {
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('Merchant App', CONFIG.WEBHOOK_DOMAIN + '/merchant-app')],
        [Markup.button.url('Web Dashboard', CONFIG.WEBHOOK_DOMAIN + '/dashboard')],
      ]),
    });
  });

  // ── API Settings ───────────────────────────────────────────────────────────
  bot.hears('API Settings', async (ctx) => {
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const slug = (merchant as any).store_slug || merchant.telegram_id;
    await ctx.reply(
      'API & Store Settings\n\n' +
      'API Key: ' + ((merchant as any).api_key ? (merchant as any).api_key.slice(0, 16) + '...' : 'Not generated') + '\n' +
      'Webhook URL: ' + ((merchant as any).webhook_url ?? 'Not set') + '\n' +
      'Store Slug: ' + ((merchant as any).store_slug ?? 'Not set') + '\n\n' +
      'Commands:\n/apikey - Generate API key\n/setwebhook <url> - Set webhook\n/set_slug <slug> - Set store slug\n/set_storename <name> - Store name\n/set_storebio <bio> - Store bio',
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Generate API Key', 'regen_api_key')],
        [Markup.button.url('Open My Store', CONFIG.WEBHOOK_DOMAIN + '/store?m=' + slug)],
      ])}
    );
  });

  // ── Browse Stores ─────────────────────────────────────────────────────────
  bot.hears('Browse Stores', async (ctx) => {
    await ctx.reply(
      'Browse a store by sending:\n/store <merchant_id_or_slug>\n\nExample:\n/store myshop\n/store 123456789\n\nOr open the store link shared by a merchant.',
      { ...Markup.inlineKeyboard([[Markup.button.url('All Stores', CONFIG.WEBHOOK_DOMAIN + '/store')]]) }
    );
  });

  // ── My Orders (customer) ──────────────────────────────────────────────────
  bot.hears('My Orders', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const { supabase } = await import('../supabase');
    const { data: orders } = await supabase.from('orders').select('*').eq('customer_tg_id', userId).order('created_at', { ascending: false }).limit(10);
    if (!orders?.length) return ctx.reply('You have no orders yet.\n\nVisit a store to start shopping!');
    const icons: Record<string, string> = { PENDING: '⏳', PAID: '✅', SHIPPED: '📦', CANCELLED: '❌' };
    await ctx.reply('Your Orders\n\n' + orders.map((o: any) => icons[o.status] + ' $' + Number(o.total_amount_usd).toFixed(2) + ' ' + o.status + ' #' + o.order_id.slice(0, 8)).join('\n'));
  });

  // ── Admin Dashboard ────────────────────────────────────────────────────────
  bot.hears('Admin Dashboard', async (ctx) => {
    if (!isAdmin(ctx.from!.id)) return ctx.reply('Unauthorized.');
    const [merchants, pendingWds, invoices] = await Promise.all([
      getAllMerchants().catch(() => []),
      getPendingWithdrawals().catch(() => []),
      getAllInvoices().catch(() => []),
    ]);
    const totalBalance = merchants.reduce((s: number, m: any) => s + Number(m.internal_balance), 0);
    await ctx.reply(
      'Admin Dashboard\n\nMerchants: ' + merchants.length + '\nTotal Balance: $' + totalBalance.toFixed(4) + ' USDT\nInvoices: ' + invoices.length + '\nPending Withdrawals: ' + pendingWds.length,
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Pending Withdrawals', 'admin_pending_wds')],
        [Markup.button.callback('All Merchants', 'admin_merchants'), Markup.button.callback('All Invoices', 'admin_invoices')],
      ])}
    );
  });

  // ── Register as Merchant ──────────────────────────────────────────────────
  bot.hears('Register as Merchant', async (ctx) => {
    await ctx.reply('Select your USDT payout network:', {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('USDT TRC20 (Tron)', 'net_TRC20')],
        [Markup.button.callback('USDT BEP20 (BSC)', 'net_BEP20')],
        [Markup.button.callback('USDT Polygon', 'net_MATIC')],
      ]),
    });
  });

  // ── Help ──────────────────────────────────────────────────────────────────
  bot.hears('Help', async (ctx) => {
    await ctx.reply(
      'Vertext Bot - Help\n\n' +
      'FOR MERCHANTS:\nMy Wallet - Balance & withdraw\nCreate Invoice - Payment links\nMy Invoices - View invoices\nMy Products - Manage products\nStore Orders - Customer orders\nMy Store - Store link & settings\nExport CSV - Accounting report\nDashboard - Web dashboard\nAPI Settings - API key & webhook\n\n' +
      'FOR CUSTOMERS:\nBrowse Stores - Find stores\nMy Orders - Your purchases\n/store <id> - Browse specific store\n/cart - View your cart\n\n' +
      'COMMANDS:\n/start - Main menu\n/add_product - Add product\n/my_products - View products\n/my_orders - View orders\n/store <id> - Browse store\n/set_slug <s> - Store URL slug\n/set_storename <n> - Store name\n/balance - Check balance\n/withdraw <amt> - Withdraw\n/apikey - API key\n/export - CSV export',
      {
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard([
          [Markup.button.url('Terms', CONFIG.WEBHOOK_DOMAIN + '/terms'), Markup.button.url('Privacy', CONFIG.WEBHOOK_DOMAIN + '/privacy')],
          [Markup.button.url('API Docs', CONFIG.WEBHOOK_DOMAIN + '/api-docs'), Markup.button.url('Dashboard', CONFIG.WEBHOOK_DOMAIN + '/dashboard')],
        ])
      }
    );
  });

  bot.action('show_help', async (ctx) => { await ctx.answerCbQuery(); await ctx.reply('Use the menu buttons below.'); });
}
