import { Telegraf } from 'telegraf';
import QRCode from 'qrcode';
import { getInvoice, getMerchant } from '../supabase';
import { createPayment } from '../nowpayments';
import { NETWORK_CURRENCY } from '../nowpayments';
import { PayoutNetwork } from '../types';

// Escapes special chars for Telegram MarkdownV2
function escMD(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}

export function registerCheckoutHandlers(bot: Telegraf) {
  // Intercept /start inv_<uuid> deep links
  bot.start(async (ctx, next) => {
    const payload = ctx.startPayload;
    if (!payload?.startsWith('inv_')) return; // not a checkout link

    const invoiceId = payload.slice(4); // strip "inv_"
    const userId = ctx.from?.id;

    // ── Load invoice ─────────────────────────────────────────────────────────
    let invoice;
    try {
      invoice = await getInvoice(invoiceId);
    } catch (err) {
      console.error('[checkout] getInvoice error:', err);
      return ctx.reply('⚠️ Unable to load invoice. Please try again later.');
    }

    if (!invoice) {
      return ctx.reply('❌ Invoice not found. Please ask the merchant for a valid link.');
    }

    if (invoice.status === 'PAID') {
      return ctx.reply('✅ This invoice has already been paid. Thank you!');
    }

    // ── Load merchant for payout network (used to pick deposit currency) ─────
    const merchant = await getMerchant(invoice.merchant_id).catch(() => null);
    const network = (merchant?.payout_network ?? 'TRC20') as PayoutNetwork;

    // ── Create NOWPayments deposit ────────────────────────────────────────────
    let payment;
    try {
      payment = await createPayment(invoice.amount_fiat, invoiceId, network);
    } catch (err: any) {
      console.error('[checkout] createPayment error:', err?.response?.data ?? err);
      return ctx.reply('⚠️ Unable to generate payment address right now. Please try again in a moment.');
    }

    const { pay_address, pay_amount, pay_currency } = payment;

    // ── Generate QR code as PNG buffer (never touches disk) ──────────────────
    let qrBuffer: Buffer;
    try {
      qrBuffer = await QRCode.toBuffer(pay_address, {
        type: 'png',
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (err) {
      console.error('[checkout] QRCode.toBuffer error:', err);
      return ctx.reply('⚠️ Failed to generate QR code. Please use the address below manually.');
    }

    // ── Build MarkdownV2 caption ──────────────────────────────────────────────
    const currencyLabel = pay_currency.toUpperCase();
    const networkLabel = NETWORK_CURRENCY[network]
      ? network
      : pay_currency.toUpperCase();

    const caption =
      `💳 *Payment Request*\n\n` +
      `📋 ${escMD(invoice.description)}\n` +
      `💵 Amount: *\\$${escMD(invoice.amount_fiat.toFixed(2))} USD*\n\n` +
      `─────────────────────\n` +
      `🪙 *Pay Exactly:*\n` +
      `\`${pay_amount} ${currencyLabel}\`\n\n` +
      `📬 *Send to Address:*\n` +
      `\`${pay_address}\`\n\n` +
      `🌐 Network: *${escMD(networkLabel)}*\n` +
      `─────────────────────\n` +
      `⚠️ Send *exactly* the amount shown\\. Wrong amounts may cause delays\\.\n` +
      `⏱ Payment expires in 20 minutes\\.`;

    // ── Send single photo message with QR + caption ───────────────────────────
    await ctx.replyWithPhoto(
      { source: qrBuffer, filename: 'payment_qr.png' },
      {
        caption,
        parse_mode: 'MarkdownV2',
      }
    );
  });
}
