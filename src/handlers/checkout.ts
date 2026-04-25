import { Telegraf } from 'telegraf';
import QRCode from 'qrcode';
import { getInvoice, getMerchant } from '../supabase';
import { createPayment, NETWORK_CURRENCY } from '../nowpayments';
import { PayoutNetwork } from '../types';

function escMD(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}

export async function handleCheckoutPayload(bot: Telegraf, ctx: any, next: any) {
  const payload = ctx.startPayload;
  if (!payload?.startsWith('inv_')) return next();
  const invoiceId = payload.slice(4);

  let invoice;
  try { invoice = await getInvoice(invoiceId); } catch { return ctx.reply('⚠️ Unable to load invoice.'); }
  if (!invoice) return ctx.reply('❌ Invoice not found.');
  if (invoice.status === 'PAID') return ctx.reply('✅ This invoice has already been paid!');

  const merchant = await getMerchant(invoice.merchant_id).catch(() => null);
  const network = (merchant?.payout_network ?? 'TRC20') as PayoutNetwork;

  let payment;
  try { payment = await createPayment(invoice.amount_fiat, invoiceId, network); }
  catch (err: any) {
    console.error('[checkout]', err?.response?.data ?? err);
    return ctx.reply('⚠️ Unable to generate payment address. Please try again.');
  }

  const { pay_address, pay_amount, pay_currency } = payment;

  let qrBuffer: Buffer;
  try { qrBuffer = await QRCode.toBuffer(pay_address, { type: 'png', width: 400, margin: 2 }); }
  catch { return ctx.reply(`📬 Send exactly \`${pay_amount} ${pay_currency.toUpperCase()}\` to:\n\`${pay_address}\``, { parse_mode: 'Markdown' }); }

  const caption =
    `💳 *Payment Request*\n\n` +
    `📋 ${escMD(invoice.description)}\n` +
    `💵 Amount: *\\$${escMD(invoice.amount_fiat.toFixed(2))} USD*\n\n` +
    `─────────────────────\n` +
    `🪙 *Pay Exactly:*\n\`${pay_amount} ${pay_currency.toUpperCase()}\`\n\n` +
    `📬 *Send to Address:*\n\`${pay_address}\`\n\n` +
    `🌐 Network: *${escMD(network)}*\n` +
    `─────────────────────\n` +
    `⚠️ Send *exactly* the amount shown\\.\n⏱ Expires in 20 minutes\\.`;

  await ctx.replyWithPhoto(
    { source: qrBuffer, filename: 'payment_qr.png' },
    { caption, parse_mode: 'MarkdownV2' }
  );
}
