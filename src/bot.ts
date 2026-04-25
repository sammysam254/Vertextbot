import { Telegraf } from 'telegraf';
import { CONFIG } from './config';
import { registerOnboardingHandlers } from './handlers/onboarding';
import { registerInvoiceHandlers } from './handlers/invoice';
import { registerCheckoutHandlers } from './handlers/checkout';
import { registerWithdrawalHandlers } from './handlers/withdrawal';

export function createBot(): Telegraf {
  const bot = new Telegraf(CONFIG.BOT_TOKEN);

  // ── Global error handler ──────────────────────────────────────────────────
  bot.catch((err: any, ctx) => {
    console.error(`[bot] Error for ${ctx.updateType}:`, err);
    ctx.reply('⚠️ Something went wrong. Please try again.').catch(() => {});
  });

  // ── Handlers (ORDER MATTERS: checkout must register start before onboarding) ─
  registerCheckoutHandlers(bot);   // deep-link /start inv_xxx
  registerOnboardingHandlers(bot); // plain /start + registration flow
  registerInvoiceHandlers(bot);    // /invoice, /balance
  registerWithdrawalHandlers(bot); // /withdraw, admin callbacks

  // ── Help command ──────────────────────────────────────────────────────────
  bot.command('help', (ctx) => {
    ctx.reply(
      `📖 *Escrow Bot Commands*\n\n` +
      `*/start* — Register as a merchant\n` +
      `*/invoice <amount> <desc>* — Create a payment invoice\n` +
      `*/balance* — Check your current balance\n` +
      `*/withdraw <amount>* — Withdraw your earnings\n` +
      `*/help* — Show this message`,
      { parse_mode: 'Markdown' }
    );
  });

  return bot;
}
