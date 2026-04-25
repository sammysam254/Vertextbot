import { Telegraf, Markup } from 'telegraf';
import { getMerchant, createInvoice, getInvoicesByMerchant, getInvoice } from '../supabase';
import { CONFIG } from '../config';

export const invoiceSession = new Map<number, { step: 'AWAITING_AMOUNT' | 'AWAITING_DESCRIPTION'; amount?: number }>();

export function registerInvoiceMenuHandlers(bot: Telegraf) {
  bot.action('invoice_start', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from!.id;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.editMessageText('❌ Register as a merchant first.',
        { ...Markup.inlineKeyboard([[Markup.button.callback('🏪 Register', 'register_merchant'), Markup.button.callback('⬅️ Back', 'back_to_menu')]]) });
    }
    invoiceSession.set(userId, { step: 'AWAITING_AMOUNT' });
    await ctx.editMessageText(
      `📄 *Create Invoice — Step 1 of 2*\n\n💵 Reply with the amount in USD:\nExample: \`50.00\``,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'back_to_menu')]]) }
    );
  });

  bot.action('my_invoices', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from!.id;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.editMessageText('❌ Register as a merchant to view invoices.',
        { ...Markup.inlineKeyboard([[Markup.button.callback('🏪 Register', 'register_merchant'), Markup.button.callback('⬅️ Back', 'back_to_menu')]]) });
    }
    const invoices = await getInvoicesByMerchant(userId, 10).catch(() => []);
    if (!invoices.length) {
      return ctx.editMessageText('📋 *My Invoices*\n\nNo invoices yet.',
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📄 Create Invoice', 'invoice_start'), Markup.button.callback('⬅️ Back', 'back_to_menu')]]) });
    }
    const buttons = invoices.map((inv: any) => [
      Markup.button.callback(`${inv.status === 'PAID' ? '✅' : '⏳'} $${Number(inv.amount_fiat).toFixed(2)} — ${inv.description.slice(0, 20)}`, `view_invoice_${inv.invoice_id}`)
    ]);
    buttons.push([Markup.button.callback('📄 New Invoice', 'invoice_start'), Markup.button.callback('⬅️ Back', 'back_to_menu')]);
    await ctx.editMessageText('📋 *My Invoices*\n\nTap to view details:',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  });

  bot.action(/^view_invoice_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const invoice = await getInvoice(ctx.match[1]).catch(() => null);
    if (!invoice) return ctx.reply('❌ Invoice not found.');
    const deepLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=inv_${invoice.invoice_id}`;
    await ctx.editMessageText(
      `🧾 *Invoice*\n\nStatus: *${invoice.status === 'PAID' ? '✅ PAID' : '⏳ PENDING'}*\nAmount: *$${Number(invoice.amount_fiat).toFixed(2)} USD*\nDesc: ${invoice.description}\nID: \`${invoice.invoice_id}\`\n\n🔗 \`${deepLink}\``,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.url('🔗 Open Link', deepLink)], [Markup.button.callback('⬅️ Back', 'my_invoices')]]) }
    );
  });

  bot.action('my_orders', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `📦 *My Orders*\n\nClick a merchant's payment link to view and pay an order.\n\nLinks look like:\n\`t.me/${CONFIG.BOT_USERNAME}?start=inv_...\``,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back_to_menu')]]) }
    );
  });
}
