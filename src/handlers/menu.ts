import { Telegraf, Markup } from 'telegraf';
import { getMerchant, getAllMerchants, getPendingWithdrawals, getAllInvoices, getInvoicesByMerchant } from '../supabase';
import { CONFIG } from '../config';

export function isAdmin(userId: number): boolean {
  return String(userId) === String(CONFIG.ADMIN_CHAT_ID);
}

const MERCHANT_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Orders'],
  ['Help'],
]).resize();

const ADMIN_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Orders'],
  ['Admin Dashboard', 'Help'],
]).resize();

const CUSTOMER_KB = Markup.keyboard([
  ['Register as Merchant'],
  ['My Orders', 'My Invoices'],
  ['Help'],
]).resize();

export async function sendMainMenu(ctx: any, userId: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  const admin = isAdmin(userId);
  if (admin) return ctx.reply('Admin Panel - Vertext Bot', { ...ADMIN_KB });
  if (merchant?.payout_address) return ctx.reply('Vertext Escrow Bot - Use the menu below:', { ...MERCHANT_KB });
  return ctx.reply('Vertext Escrow Bot - Secure crypto escrow & invoicing.', { ...CUSTOMER_KB });
}

export function registerMenuHandlers(bot: Telegraf) {
  bot.command('menu', async (ctx) => { await sendMainMenu(ctx, ctx.from!.id); });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await sendMainMenu(ctx, ctx.from!.id);
  });

  bot.hears('My Wallet', async (ctx) => {
    const merchant = await getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.', { ...Markup.inlineKeyboard([[Markup.button.callback('Register', 'register_merchant')]]) });
    const { getNetworkFee, calcFees } = await import('../nowpayments');
    const networkFee = await getNetworkFee(merchant.payout_network as any);
    const { totalFee } = calcFees(networkFee);
    await ctx.reply('My Wallet\n\nBalance: $' + Number(merchant.internal_balance).toFixed(4) + ' USDT\nNetwork: ' + merchant.payout_network + '\nAddress: ' + merchant.payout_address + '\nFees: ~$' + totalFee.toFixed(4) + ' per withdrawal',
      { ...Markup.inlineKeyboard([[Markup.button.callback('Deposit', 'wallet_deposit'), Markup.button.callback('Withdraw', 'wallet_withdraw')], [Markup.button.callback('Refresh', 'wallet_menu')]]) }
    );
  });

  bot.hears('Create Invoice', async (ctx) => {
    const { invoiceSession } = await import('./invoiceMenu');
    invoiceSession.set(ctx.from!.id, { step: 'AWAITING_AMOUNT' });
    await ctx.reply('Create Invoice - Step 1 of 2\n\nReply with amount in USD:\nExample: 50.00', { ...Markup.inlineKeyboard([[Markup.button.callback('Cancel', 'back_to_menu')]]) });
  });

  bot.hears('My Invoices', async (ctx) => {
    const invoices = await getInvoicesByMerchant(ctx.from!.id, 10).catch(() => []);
    if (!invoices.length) return ctx.reply('No invoices yet.', { ...Markup.inlineKeyboard([[Markup.button.callback('Create Invoice', 'invoice_start')]]) });
    const buttons = invoices.map((inv: any) => [Markup.button.callback((inv.status === 'PAID' ? 'PAID ' : 'PENDING ') + '$' + Number(inv.amount_fiat).toFixed(2) + ' - ' + inv.description.slice(0, 20), 'view_invoice_' + inv.invoice_id)]);
    buttons.push([Markup.button.callback('New Invoice', 'invoice_start')]);
    await ctx.reply('My Invoices:', { ...Markup.inlineKeyboard(buttons) });
  });

  bot.hears('My Orders', async (ctx) => {
    await ctx.reply('Click a merchant payment link to pay.\nLinks: t.me/' + CONFIG.BOT_USERNAME + '?start=inv_...');
  });

  bot.hears('Register as Merchant', async (ctx) => {
    await ctx.reply('Select your USDT payout network:', { ...Markup.inlineKeyboard([[Markup.button.callback('USDT TRC20 (Tron)', 'net_TRC20')], [Markup.button.callback('USDT BEP20 (BSC)', 'net_BEP20')], [Markup.button.callback('USDT Polygon', 'net_MATIC')]]) });
  });

  bot.hears('Admin Dashboard', async (ctx) => {
    if (!isAdmin(ctx.from!.id)) return ctx.reply('Unauthorized.');
    const [merchants, pendingWds, invoices] = await Promise.all([getAllMerchants().catch(() => []), getPendingWithdrawals().catch(() => []), getAllInvoices().catch(() => [])]);
    const totalBalance = merchants.reduce((s: number, m: any) => s + Number(m.internal_balance), 0);
    await ctx.reply('Admin Dashboard\n\nMerchants: ' + merchants.length + '\nTotal Balance: $' + totalBalance.toFixed(4) + ' USDT\nInvoices: ' + invoices.length + '\nPending Withdrawals: ' + pendingWds.length,
      { ...Markup.inlineKeyboard([[Markup.button.callback('Pending Withdrawals', 'admin_pending_wds')], [Markup.button.callback('All Merchants', 'admin_merchants'), Markup.button.callback('All Invoices', 'admin_invoices')]]) }
    );
  });

  bot.hears('Help', async (ctx) => {
    await ctx.reply('Vertext Bot Help\n\nFor Merchants:\n1. Register and add your wallet\n2. Create invoices for customers\n3. Share the invoice link\n4. Get paid in USDT automatically\n5. Withdraw to your wallet anytime\n\nCommands:\n/start - Main menu\n/balance - Check balance\n/withdraw amount - Withdraw funds');
  });

  bot.action('show_help', async (ctx) => { await ctx.answerCbQuery(); await ctx.reply('Use the menu buttons below.'); });
}
