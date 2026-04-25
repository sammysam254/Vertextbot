import { Telegraf, Markup } from 'telegraf';
import QRCode from 'qrcode';
import axios from 'axios';
import { getInvoice, getMerchant, supabase } from '../supabase';
import { createPayment } from '../nowpayments';
import { PayoutNetwork } from '../types';
import { CONFIG } from '../config';

function escMD(t: string) { return t.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, c => `\\${c}`); }

// Fetch supported currencies from NOWPayments
async function getSupportedCurrencies(): Promise<string[]> {
  try {
    const { data } = await axios.get('https://api.nowpayments.io/v1/currencies', {
      headers: { 'x-api-key': CONFIG.NOW_API_KEY },
    });
    return data.currencies ?? [];
  } catch {
    // Fallback popular ones
    return ['btc', 'eth', 'usdttrc20', 'usdtbsc', 'usdtmatic', 'bnb', 'ltc', 'trx', 'matic', 'sol', 'xrp', 'doge', 'ada'];
  }
}

// Popular currencies to show first on the picker
const POPULAR = [
  { label: '₿ Bitcoin', code: 'btc' },
  { label: '⟠ Ethereum', code: 'eth' },
  { label: '💵 USDT TRC20', code: 'usdttrc20' },
  { label: '💵 USDT BEP20', code: 'usdtbsc' },
  { label: '💵 USDT Polygon', code: 'usdtmatic' },
  { label: '🔶 BNB', code: 'bnb' },
  { label: '◎ Solana', code: 'sol' },
  { label: '✕ XRP', code: 'xrp' },
  { label: '🐕 Dogecoin', code: 'doge' },
  { label: '🔷 MATIC', code: 'matic' },
  { label: '⚡ Litecoin', code: 'ltc' },
  { label: '🌊 TRX', code: 'trx' },
];

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
    await supabase.from('invoices').update({ status: 'EXPIRED' }).eq('invoice_id', invoiceId);
    return ctx.reply('⛔ Invoice expired. Ask the merchant for a new link.');
  }

  // Show currency picker
  const buttons = POPULAR.map(c => [
    Markup.button.callback(c.label, `pay_currency_${invoiceId}_${c.code}`)
  ]);
  buttons.push([Markup.button.callback('🔍 Other Currency', `pay_currency_${invoiceId}_other`)]);

  await ctx.reply(
    `💳 *Payment Request*\n\n` +
    `📋 ${invoice.description}\n` +
    `💵 Amount: *$${Number(invoice.amount_fiat).toFixed(2)} USD*\n\n` +
    `Select which crypto you want to pay with:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    }
  );
}

export function registerCurrencyPickerHandlers(bot: Telegraf) {
  // Handle currency selection
  bot.action(/^pay_currency_([^_]+(?:_[^_]+)*)_([a-z0-9]+)$/, async (ctx) => {
    await ctx.answerCbQuery('Generating payment…');

    // Extract invoiceId and currency — currency is last segment
    const parts = ctx.match[0].replace('pay_currency_', '').split('_');
    const currency = parts[parts.length - 1];
    const invoiceId = parts.slice(0, -1).join('-'); // UUIDs use dashes

    // Better extraction using the full match
    const fullMatch = ctx.match[0]; // pay_currency_<invoiceId>_<currency>
    const prefix = 'pay_currency_';
    const withoutPrefix = fullMatch.slice(prefix.length);
    // invoiceId is UUID format: 8-4-4-4-12
    const uuidMatch = withoutPrefix.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(.+)$/);
    
    if (!uuidMatch) return ctx.reply('❌ Invalid selection. Please try again.');
    const realInvoiceId = uuidMatch[1];
    const payCurrency = uuidMatch[2];

    if (payCurrency === 'other') {
      // Show all supported currencies in pages
      const allCurrencies = await getSupportedCurrencies();
      const otherButtons = allCurrencies.slice(0, 20).map(c => [
        Markup.button.callback(c.toUpperCase(), `pay_currency_${realInvoiceId}_${c}`)
      ]);
      otherButtons.push([Markup.button.callback('⬅️ Back', `reopen_inv_${realInvoiceId}`)]);
      return ctx.editMessageText(
        '🔍 Select a currency:',
        { ...Markup.inlineKeyboard(otherButtons) }
      );
    }

    await generatePaymentAddress(bot, ctx, realInvoiceId, payCurrency);
  });

  // Reopen invoice currency picker
  bot.action(/^reopen_inv_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const invoiceId = ctx.match[1];
    const invoice = await getInvoice(invoiceId).catch(() => null);
    if (!invoice) return ctx.reply('❌ Invoice not found.');

    const buttons = POPULAR.map(c => [
      Markup.button.callback(c.label, `pay_currency_${invoiceId}_${c.code}`)
    ]);
    buttons.push([Markup.button.callback('🔍 Other Currency', `pay_currency_${invoiceId}_other`)]);

    await ctx.editMessageText(
      `💳 *Payment Request*\n\n📋 ${invoice.description}\n💵 *$${Number(invoice.amount_fiat).toFixed(2)} USD*\n\nSelect crypto to pay with:`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
    );
  });
}

async function generatePaymentAddress(bot: Telegraf, ctx: any, invoiceId: string, payCurrency: string) {
  const invoice = await getInvoice(invoiceId).catch(() => null);
  if (!invoice) return ctx.reply('❌ Invoice not found.');
  if (invoice.status === 'PAID') return ctx.editMessageText('✅ Already paid!');

  await ctx.editMessageText(`⏳ Generating *${payCurrency.toUpperCase()}* payment address…`, { parse_mode: 'Markdown' });

  let payment;
  try {
    // Create payment with customer's chosen currency
    const { data } = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: invoice.amount_fiat,
        price_currency: 'usd',
        pay_currency: payCurrency,
        order_id: invoiceId,
        order_description: invoice.description,
        ipn_callback_url: `${CONFIG.WEBHOOK_DOMAIN}/webhook/nowpayments`,
      },
      { headers: { 'x-api-key': CONFIG.NOW_API_KEY } }
    );
    payment = data;
  } catch (err: any) {
    console.error('[checkout] createPayment error:', err?.response?.data ?? err);
    return ctx.editMessageText(
      `❌ Could not generate address for *${payCurrency.toUpperCase()}*. Please select a different currency.`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Choose Another', `reopen_inv_${invoiceId}`)]]) }
    );
  }

  const { pay_address, pay_amount, pay_currency, payment_id } = payment;

  // Save payment_id and expiry
  try {
    await supabase.from('invoices').update({
      now_payment_id: payment_id,
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    }).eq('invoice_id', invoiceId);
  } catch {}

  // Generate QR
  let qrBuffer: Buffer;
  try { qrBuffer = await QRCode.toBuffer(pay_address, { type: 'png', width: 400, margin: 2 }); }
  catch {
    return ctx.reply(
      `📬 Send \`${pay_amount} ${pay_currency.toUpperCase()}\` to:\n\`${pay_address}\``,
      { parse_mode: 'Markdown' }
    );
  }

  const caption =
    `💳 *Payment Request*\n\n` +
    `📋 ${escMD(invoice.description)}\n` +
    `💵 *\\$${escMD(Number(invoice.amount_fiat).toFixed(2))} USD*\n\n` +
    `─────────────────────\n` +
    `🪙 *Pay Exactly:*\n\`${pay_amount} ${pay_currency.toUpperCase()}\`\n\n` +
    `📬 *Send to Address:*\n\`${pay_address}\`\n\n` +
    `─────────────────────\n` +
    `⏱ Expires in *20 minutes*\n` +
    `⚠️ Send *exactly* the amount shown\\.`;

  await ctx.replyWithPhoto(
    { source: qrBuffer, filename: 'qr.png' },
    { caption, parse_mode: 'MarkdownV2' }
  );

  await ctx.reply(
    `📊 *Track your payment live:*`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📡 Track Payment', `check_status_${invoiceId}`)],
        [Markup.button.callback('🔄 Pay with Different Crypto', `reopen_inv_${invoiceId}`)],
      ]),
    }
  );
}
