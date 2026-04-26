import { Telegraf, Markup } from 'telegraf';
import { getMerchant, getAllMerchants, getPendingWithdrawals, getAllInvoices, getInvoicesByMerchant } from '../supabase';
import { CONFIG } from '../config';

export function isAdmin(userId: number): boolean {
  return String(userId) === String(CONFIG.ADMIN_CHAT_ID);
}

const MERCHANT_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Orders'],
  ['Export CSV', 'Dashboard'],
  ['API Settings', 'Help'],
]).resize();

const ADMIN_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Orders'],
  ['Export CSV', 'Dashboard'],
  ['Admin Dashboard', 'API Settings'],
  ['Help'],
]).resize();

const CUSTOMER_KB = Markup.keyboard([
  ['Register as Merchant'],
  ['My Orders', 'My Invoices'],
  ['Help'],
]).resize();

export async function sendMainMenu(ctx: any, userId: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  const admin = isAdmin(userId);
  if (admin) return ctx.reply('Admin Panel - Vertext Bot\n\nSelect an option below:', { ...ADMIN_KB });
  if (merchant?.payout_address) return ctx.reply('Vertext Escrow Bot\n\nUse the menu below:', { ...MERCHANT_KB });
  return ctx.reply('Vertext Escrow Bot\n\nSecure crypto escrow & invoicing.', { ...CUSTOMER_KB });
}

export function registerMenuHandlers(bot: Telegraf) {
  bot.command('menu', async (ctx) => { await sendMainMenu(ctx, ctx.from!.id); });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await sendMainMenu(ctx, ctx.from!.id);
  });

  // My Wallet
  bot.hears('My Wallet', async (ctx) => {
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.', { ...Markup.inlineKeyboard([[Markup.button.callback('Register', 'register_merchant')]]) });
    const { getNetworkFee, calcFees } = await import('../nowpayments');
    const networkFee = await getNetworkFee(merchant.payout_network as any);
    const { totalFee } = calcFees(networkFee);
    const locked = Number((merchant as any).locked_amount ?? 0);
    await ctx.reply(
      'My Wallet\n\nAvailable: $' + Number(merchant.internal_balance).toFixed(4) + ' USDT' +
      (locked > 0 ? '\nLocked (dispute): $' + locked.toFixed(4) : '') +
      '\nNetwork: ' + merchant.payout_network +
      '\nAddress: ' + merchant.payout_address +
      '\nWithdrawal fee: ~$' + totalFee.toFixed(4),
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Deposit', 'wallet_deposit'), Markup.button.callback('Withdraw', 'wallet_withdraw')],
        [Markup.button.callback('Refresh', 'wallet_menu')],
      ])}
    );
  });

  // Create Invoice
  bot.hears('Create Invoice', async (ctx) => {
    const { invoiceSession } = await import('./invoiceMenu');
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.', { ...Markup.inlineKeyboard([[Markup.button.callback('Register', 'register_merchant')]]) });
    invoiceSession.set(ctx.from!.id, { step: 'AWAITING_AMOUNT' });
    await ctx.reply('Create Invoice - Step 1 of 2\n\nReply with the amount in USD:\nExample: 50.00', { ...Markup.inlineKeyboard([[Markup.button.callback('Cancel', 'back_to_menu')]]) });
  });

  // My Invoices
  bot.hears('My Invoices', async (ctx) => {
    const invoices = await getInvoicesByMerchant(ctx.from!.id, 10).catch(() => []);
    if (!invoices.length) return ctx.reply('No invoices yet.', { ...Markup.inlineKeyboard([[Markup.button.callback('Create Invoice', 'invoice_start')]]) });
    const buttons = invoices.map((inv: any) => [
      Markup.button.callback(
        (inv.status === 'PAID' ? 'PAID' : inv.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING') + ' $' + Number(inv.amount_fiat).toFixed(2) + ' - ' + inv.description.slice(0, 18),
        'view_invoice_' + inv.invoice_id
      )
    ]);
    buttons.push([Markup.button.callback('New Invoice', 'invoice_start')]);
    await ctx.reply('My Invoices (tap to view):', { ...Markup.inlineKeyboard(buttons) });
  });

  // My Orders
  bot.hears('My Orders', async (ctx) => {
    await ctx.reply('Click a merchant payment link to pay.\nLinks: t.me/' + CONFIG.BOT_USERNAME + '?start=inv_...');
  });

  // Export CSV
  bot.hears('Export CSV', async (ctx) => {
    const userId = ctx.from!.id;
    await ctx.reply('Generating your 30-day accounting report...');
    const { registerExportHandlers } = await import('../enterprise/csvExport');
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
      'VERTEXT ACCOUNTING EXPORT - ' + new Date().toUTCString(),
      'Period: Last 30 days',
      '',
      '=== INVOICES ===',
      invoices.length ? new Parser({ fields: ['invoice_id','description','amount_fiat','status','paid_currency','txid','dispute_status','created_at'] }).parse(invoices) : 'None',
      '',
      '=== WITHDRAWALS ===',
      withdrawals.length ? new Parser({ fields: ['withdrawal_id','amount_requested','fee_deducted','net_payout','status','created_at'] }).parse(withdrawals) : 'None',
    ].join('\n');
    const csv = Buffer.from(lines, 'utf-8');
    const filename = 'vertext_export_' + userId + '_' + new Date().toISOString().slice(0,10) + '.csv';
    await ctx.replyWithDocument({ source: csv, filename }, { caption: 'Accounting Export\nInvoices: ' + invoices.length + '\nWithdrawals: ' + withdrawals.length });
  });

  // Dashboard (Mini App)
  bot.hears('Dashboard', async (ctx) => {
    const dashUrl = CONFIG.WEBHOOK_DOMAIN + '/dashboard';
    await ctx.reply('Open your merchant dashboard:', {
      ...Markup.inlineKeyboard([[Markup.button.webApp('Open Dashboard', dashUrl)]]),
    });
  });

  // API Settings
  bot.hears('API Settings', async (ctx) => {
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const apiKey = (merchant as any).api_key;
    const webhookUrl = (merchant as any).webhook_url;
    await ctx.reply(
      'API Settings\n\n' +
      'API Key: ' + (apiKey ? apiKey.slice(0, 12) + '...' : 'Not generated') + '\n' +
      'Webhook URL: ' + (webhookUrl ?? 'Not set') + '\n\n' +
      'Commands:\n' +
      '/apikey - Generate/view API key\n' +
      '/setwebhook <url> - Set webhook URL\n' +
      '/removewebhook - Remove webhook URL',
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Generate API Key', 'regen_api_key')],
      ])}
    );
  });

  // Admin Dashboard
  bot.hears('Admin Dashboard', async (ctx) => {
    if (!isAdmin(ctx.from!.id)) return ctx.reply('Unauthorized.');
    const [merchants, pendingWds, invoices] = await Promise.all([
      getAllMerchants().catch(() => []),
      getPendingWithdrawals().catch(() => []),
      getAllInvoices().catch(() => []),
    ]);
    const totalBalance = merchants.reduce((s: number, m: any) => s + Number(m.internal_balance), 0);
    const lockedBalance = merchants.reduce((s: number, m: any) => s + Number((m as any).locked_amount ?? 0), 0);
    const paidInvoices = invoices.filter((i: any) => i.status === 'PAID').length;
    const openDisputes = invoices.filter((i: any) => i.dispute_status === 'OPEN').length;
    await ctx.reply(
      'Admin Dashboard\n\n' +
      'Merchants: ' + merchants.length + '\n' +
      'Total Balance: $' + totalBalance.toFixed(4) + ' USDT\n' +
      'Locked (disputes): $' + lockedBalance.toFixed(4) + '\n' +
      'Invoices: ' + invoices.length + ' (' + paidInvoices + ' paid)\n' +
      'Open Disputes: ' + openDisputes + '\n' +
      'Pending Withdrawals: ' + pendingWds.length,
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Pending Withdrawals', 'admin_pending_wds')],
        [Markup.button.callback('All Merchants', 'admin_merchants'), Markup.button.callback('All Invoices', 'admin_invoices')],
      ])}
    );
  });

  // Help
  bot.hears('Help', async (ctx) => {
    await ctx.reply(
      'Vertext Bot - Help\n\n' +
      'MERCHANT MENU:\n' +
      'My Wallet - Balance, deposit & withdraw\n' +
      'Create Invoice - Generate payment links\n' +
      'My Invoices - View all invoices\n' +
      'Export CSV - Download 30-day report\n' +
      'Dashboard - Web dashboard\n' +
      'API Settings - Webhook & API key\n\n' +
      'COMMANDS:\n' +
      '/start - Main menu\n' +
      '/balance - Check balance\n' +
      '/withdraw <amount> - Withdraw funds\n' +
      '/export - CSV accounting export\n' +
      '/dashboard - Open web dashboard\n' +
      '/apikey - Generate API key\n' +
      '/setwebhook <url> - Set webhook URL\n' +
      '/checkpayment <id> - Track payment\n\n' +
      'ADMIN ONLY:\n' +
      '/resolve_dispute <id> <release|refund>'
    );
  });

  bot.action('show_help', async (ctx) => { await ctx.answerCbQuery(); await ctx.reply('Use the menu buttons below.'); });
}
