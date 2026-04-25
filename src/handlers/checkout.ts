import { Telegraf, Markup } from 'telegraf';
import QRCode from 'qrcode';
import { getInvoice, getMerchant, supabase } from '../supabase';
import { createPayment } from '../nowpayments';
import { PayoutNetwork } from '../types';

function escMD(t: string) { return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, c => `\\${c}`); }

export async function handleCheckoutPayload(bot: Telegraf, ctx: any, next: any) {
  const payload = ctx.startPayload;
  if (!payload?.startsWith('inv_')) return next();
  const invoiceId = payload.slice(4);
  let invoice;
  try { invoice = await getInvoice(invoiceId); } catch { return ctx.reply('⚠️ Unable to load invoice.'); }
  if (!invoice) return ctx.reply('❌ Invoice not found.');
  if (invoice.status === 'PAID') return ctx.reply('✅ Already paid. Thank you!');
  if ((invoice as any).status === 'EXPIRED') return ctx.reply('⛔ Invoice expired. Ask the merchant for a new one.');
  const expiresAt = (invoice as any).expires_at ? new Date((invoice as any).expires_at) : null;
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    await supabase.from('invoices').update({ status: 'EXPIRED' }).eq('invoice_id', invoiceId).catch(() => {});
    return ctx.reply('⛔ Invoice expired. Ask the merchant for a new link.');
  }
  const merchant = await getMerchant(invoice.merchant_id).catch(() => null);
  const network = (merchant?.payout_network ?? 'TRC20') as PayoutNetwork;
  let payment;
  try { payment = await createPayment(invoice.amount_fiat, invoiceId, network); }
  catch (err: any) { console.error('[checkout]', err?.response?.data ?? err); return ctx.reply('⚠️ Unable to generate payment. Try again.'); }
  const { pay_address, pay_amount, pay_currency, payment_id } = payment;
  await supabase.from('invoices').update({ now_payment_id: payment_id, expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString() }).eq('invoice_id', invoiceId).catch(() => {});
  let qrBuffer: Buffer;
  try { qrBuffer = await QRCode.toBuffer(pay_address, { type: 'png', width: 400, margin: 2 }); }
  catch { return ctx.reply(`📬 Send \`${pay_amount} ${pay_currency.toUpperCase()}\` to:\n\`${pay_address}\``, { parse_mode: 'Markdown' }); }
  await ctx.replyWithPhoto(
    { source: qrBuffer, filename: 'qr.png' },
    { caption: `💳 *Payment Request*\n\n📋 ${escMD(invoice.description)}\n💵 *\\$${escMD(invoice.amount_fiat.toFixed(2))} USD*\n\n🪙 *Pay Exactly:*\n\`${pay_amount} ${pay_currency.toUpperCase()}\`\n\n📬 *Address:*\n\`${pay_address}\`\n\n🌐 *${escMD(network)}*\n⏱ Expires in *20 minutes*`, parse_mode: 'MarkdownV2' }
  );
  await ctx.reply('📊 *Track your payment live:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📡 Track Payment', `check_status_${invoiceId}`)]]) });
}
