import { Telegraf, Markup } from 'telegraf';
import { CONFIG } from './config';
import { registerMenuHandlers, sendMainMenu } from './handlers/menu';
import { registerOnboardingHandlers } from './handlers/onboarding';
import { registerInvoiceMenuHandlers, invoiceSession } from './handlers/invoiceMenu';
import { registerWalletHandlers, withdrawSession } from './handlers/wallet';
import { registerWithdrawalHandlers } from './handlers/withdrawal';
import { registerAdminHandlers } from './handlers/admin';
import { registerPaymentStatusHandlers } from './handlers/paymentStatus';
import { registerCurrencyPickerHandlers, handleCheckoutPayload } from './handlers/checkout';
import { registerDisputeHandlers } from './enterprise/disputes';
import { registerExportHandlers } from './enterprise/csvExport';
import { registerApiKeyHandlers } from './enterprise/apiKeys';
import { getMerchant, createInvoice } from './supabase';

export function createBot(): Telegraf {
  const bot = new Telegraf(CONFIG.BOT_TOKEN);

  bot.catch((err: any, ctx) => {
    console.error(`[bot] Error for ${ctx.updateType}:`, err);
    ctx.reply('Something went wrong. Please try again.').catch(() => {});
  });

  bot.start(async (ctx, next) => {
    const payload = (ctx as any).startPayload;
    if (payload?.startsWith('inv_')) return handleCheckoutPayload(bot, ctx, next);
    await sendMainMenu(ctx, ctx.from!.id);
  });

  registerMenuHandlers(bot);
  registerOnboardingHandlers(bot);
  registerInvoiceMenuHandlers(bot);
  registerWalletHandlers(bot);
  registerWithdrawalHandlers(bot);
  registerAdminHandlers(bot);
  registerPaymentStatusHandlers(bot);
  registerCurrencyPickerHandlers(bot);
  registerDisputeHandlers(bot);
  registerExportHandlers(bot);
  registerApiKeyHandlers(bot);

  bot.command('balance', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant) return ctx.reply('You are not registered as a merchant.');
    await ctx.reply(
      'Your Balance\n\nAvailable: $' + Number(merchant.internal_balance).toFixed(4) + ' USDT\nNetwork: ' + merchant.payout_network + '\nAddress: ' + merchant.payout_address,
      { ...Markup.inlineKeyboard([[Markup.button.callback('Open Wallet', 'wallet_menu'), Markup.button.callback('Export CSV', 'export_csv')]]) }
    );
  });

  bot.command('dashboard', async (ctx) => {
    await ctx.reply('Open your merchant dashboard:', {
      ...Markup.inlineKeyboard([[Markup.button.webApp('Open Dashboard', CONFIG.WEBHOOK_DOMAIN + '/dashboard')]]),
    });
  });

  bot.command('help', (ctx) => {
    ctx.reply(
      'Vertext Bot Commands\n\n' +
      '/start - Main menu\n/balance - Check balance\n/withdraw <amount> - Withdraw\n' +
      '/export - CSV report\n/dashboard - Web dashboard\n' +
      '/apikey - Generate API key\n/setwebhook <url> - Set webhook\n' +
      '/removewebhook - Remove webhook\n' +
      '/resolve_dispute <id> <release|refund> - Admin only'
    );
  });

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return next();

    const invSess = invoiceSession.get(userId);
    if (invSess) {
      if (invSess.step === 'AWAITING_AMOUNT') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount. Enter a number like 50.00');
        if (amount < 1) return ctx.reply('Minimum is $1.00');
        invoiceSession.set(userId, { step: 'AWAITING_DESCRIPTION', amount });
        return ctx.reply('Step 2 of 2 - Enter a description:', { ...Markup.inlineKeyboard([[Markup.button.callback('Cancel', 'back_to_menu')]]) });
      }
      if (invSess.step === 'AWAITING_DESCRIPTION') {
        if (text.length > 200) return ctx.reply('Max 200 characters.');
        invoiceSession.delete(userId);
        try {
          const invoice = await createInvoice(userId, invSess.amount!, text);
          const deepLink = 'https://t.me/' + CONFIG.BOT_USERNAME + '?start=inv_' + invoice.invoice_id;
          return ctx.reply(
            'Invoice Created!\n\n' + text + '\n$' + invSess.amount!.toFixed(2) + ' USD\n\nShare link:\n' + deepLink,
            { ...Markup.inlineKeyboard([[Markup.button.url('Open Link', deepLink)], [Markup.button.callback('New Invoice', 'invoice_start'), Markup.button.callback('Wallet', 'wallet_menu')]]) }
          );
        } catch { invoiceSession.delete(userId); return ctx.reply('Failed to create invoice. Try again.'); }
      }
    }

    const wdSess = withdrawSession.get(userId);
    if (wdSess?.step === 'AWAITING_AMOUNT') {
      const amount = parseFloat(text);
      withdrawSession.delete(userId);
      if (isNaN(amount) || amount <= 0) return ctx.reply('Invalid amount.');
      const { handleWithdrawAmount } = await import('./handlers/wallet');
      return handleWithdrawAmount(bot, ctx, userId, amount);
    }

    return next();
  });

  return bot;
}
