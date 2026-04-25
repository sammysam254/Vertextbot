import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import { getInvoice, supabase } from '../supabase';
import { CONFIG } from '../config';

const activePayments = new Map<string, { chatId: number; messageId: number; intervalHandle: ReturnType<typeof setInterval>; }>();

async function fetchPaymentStatus(paymentId: string) {
  try {
    const { data } = await axios.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, { headers: { 'x-api-key': CONFIG.NOW_API_KEY } });
    return { status: data.payment_status };
  } catch { return null; }
}

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return '⛔ Expired';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `⏱ ${mins}m ${secs}s remaining`;
}

function buildProgressBar(expiresAt: Date): string {
  const totalTime = 20 * 60 * 1000;
  const elapsed = totalTime - (expiresAt.getTime() - Date.now());
  const percent = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  const filled = Math.round(percent / 10);
  return `\`[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${Math.round(percent)}%\``;
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = { waiting: '⏳', confirming: '🔄', confirmed: '✅', sending: '📤', finished: '✅', failed: '❌', refunded: '↩️', expired: '⛔' };
  return map[status] ?? '❓';
}

function getStatusMessage(status: string): string {
  const msgs: Record<string, string> = { waiting: '👀 Waiting for payment on the blockchain.', confirming: '🔄 Payment detected! Awaiting confirmations.', confirmed: '✅ Confirmed! Processing...', sending: '📤 Sending to merchant...', finished: '🎉 Payment complete!', failed: '❌ Payment failed. Try again.', expired: '⛔ Payment window expired.' };
  return msgs[status] ?? '⏳ Checking status...';
}

export function stopTracker(invoiceId: string) {
  const t = activePayments.get(invoiceId);
  if (t) { clearInterval(t.intervalHandle); activePayments.delete(invoiceId); }
}

export function registerPaymentStatusHandlers(bot: Telegraf) {
  bot.action(/^check_status_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('Checking payment…');
    await startPaymentTracker(bot, ctx, ctx.match[1]);
  });

  bot.command('checkpayment', async (ctx) => {
    const invoiceId = ctx.message.text.split(' ')[1]?.trim();
    if (!invoiceId) return ctx.reply('Usage: /checkpayment <invoice_id>');
    await startPaymentTracker(bot, ctx, invoiceId);
  });

  bot.action(/^stop_tracking_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('Stopped.');
    stopTracker(ctx.match[1]);
    await ctx.editMessageText('🔕 Tracking stopped.', { ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Main Menu', 'back_to_menu')]]) });
  });
}

export async function startPaymentTracker(bot: Telegraf, ctx: any, invoiceId: string) {
  stopTracker(invoiceId);
  const invoice = await getInvoice(invoiceId).catch(() => null);
  if (!invoice) return ctx.reply('❌ Invoice not found.');
  if (invoice.status === 'PAID') return ctx.reply('✅ Already paid!', { ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'back_to_menu')]]) });

  const expiresAt = (invoice as any).expires_at ? new Date((invoice as any).expires_at) : new Date(new Date(invoice.created_at).getTime() + 20 * 60 * 1000);
  if (expiresAt.getTime() < Date.now()) {
    await supabase.from('invoices').update({ status: 'EXPIRED' }).eq('invoice_id', invoiceId).catch(() => {});
    return ctx.reply('⛔ *Invoice Expired*\n\nAsk the merchant to send a new invoice link.', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'back_to_menu')]]) });
  }

  const sent = await ctx.reply(
    `📊 *Payment Tracker*\n\n⏳ Status: *WAITING*\n${formatCountdown(expiresAt)}\n${buildProgressBar(expiresAt)}\n\n👀 Waiting for payment on the blockchain.`,
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Refresh', `check_status_${invoiceId}`), Markup.button.callback('🛑 Stop', `stop_tracking_${invoiceId}`)]])}
  );

  const chatId = sent.chat.id;
  const messageId = sent.message_id;

  const intervalHandle = setInterval(async () => {
    try {
      const fresh = await getInvoice(invoiceId);
      if (!fresh) { stopTracker(invoiceId); return; }
      const expiry = (fresh as any).expires_at ? new Date((fresh as any).expires_at) : new Date(new Date(fresh.created_at).getTime() + 20 * 60 * 1000);

      if (fresh.status === 'PAID') {
        stopTracker(invoiceId);
        await bot.telegram.editMessageText(chatId, messageId, undefined, `🎉 *Payment Confirmed!*\n\nAmount: *$${Number(fresh.amount_fiat).toFixed(2)} USDT*\n\nThank you! Merchant has been notified.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'back_to_menu')]]) });
        return;
      }

      if (expiry.getTime() < Date.now()) {
        stopTracker(invoiceId);
        await supabase.from('invoices').update({ status: 'EXPIRED' }).eq('invoice_id', invoiceId).catch(() => {});
        await bot.telegram.editMessageText(chatId, messageId, undefined, `⛔ *Payment Expired*\n\nAsk the merchant to send a new invoice link.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Menu', 'back_to_menu')]]) });
        return;
      }

      let payStatus = 'waiting';
      if ((fresh as any).now_payment_id) {
        const result = await fetchPaymentStatus((fresh as any).now_payment_id);
        if (result) payStatus = result.status;
      }

      await bot.telegram.editMessageText(chatId, messageId, undefined,
        `📊 *Payment Tracker*\n\n${getStatusEmoji(payStatus)} Status: *${payStatus.toUpperCase()}*\n${formatCountdown(expiry)}\n${buildProgressBar(expiry)}\n\n${getStatusMessage(payStatus)}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Refresh', `check_status_${invoiceId}`), Markup.button.callback('🛑 Stop', `stop_tracking_${invoiceId}`)]])}
      );
    } catch (err: any) {
      if (!err?.description?.includes('message is not modified')) console.error('[tracker]', err?.description ?? err);
    }
  }, 15000);

  activePayments.set(invoiceId, { chatId, messageId, intervalHandle });
}
