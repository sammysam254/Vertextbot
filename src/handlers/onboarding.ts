import { Telegraf, Markup, Context } from 'telegraf';
import { getMerchant, upsertMerchant } from '../supabase';
import { PayoutNetwork } from '../types';
import { CONFIG } from '../config';

// In-memory session store for multi-step onboarding (swap for Redis on scale)
const onboardingSession = new Map<
  number,
  { step: 'AWAITING_ADDRESS'; network: PayoutNetwork }
>();

const NETWORK_LABELS: Record<PayoutNetwork, string> = {
  TRC20: '🔵 USDT TRC20 (Tron)',
  BEP20: '🟡 USDT BEP20 (BSC)',
  MATIC: '🟣 USDT Polygon (MATIC)',
};

const NETWORK_EXAMPLE_ADDR: Record<PayoutNetwork, string> = {
  TRC20: 'T...',
  BEP20: '0x...',
  MATIC: '0x...',
};

export function registerOnboardingHandlers(bot: Telegraf) {

  // ─── Register CTA ─────────────────────────────────────────────────────────
  bot.action('register_merchant', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📡 *Select your preferred USDT payout network:*\n\nThis is the network where you\'ll receive your earnings.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(NETWORK_LABELS.TRC20, 'net_TRC20')],
          [Markup.button.callback(NETWORK_LABELS.BEP20, 'net_BEP20')],
          [Markup.button.callback(NETWORK_LABELS.MATIC, 'net_MATIC')],
        ]),
      }
    );
  });

  // ─── Network Selection ────────────────────────────────────────────────────
  for (const network of ['TRC20', 'BEP20', 'MATIC'] as PayoutNetwork[]) {
    bot.action(`net_${network}`, async (ctx) => {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;

      onboardingSession.set(userId, { step: 'AWAITING_ADDRESS', network });

      await ctx.editMessageText(
        `✅ Network selected: *${NETWORK_LABELS[network]}*\n\nNow please reply with your *${network} wallet address*.\n\nExample starts with: \`${NETWORK_EXAMPLE_ADDR[network]}\`\n\n⚠️ Double-check your address — payouts sent to wrong addresses are unrecoverable.`,
        { parse_mode: 'Markdown' }
      );
    });
  }

  // ─── Address Text Input ───────────────────────────────────────────────────
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const session = onboardingSession.get(userId);
    if (!session || session.step !== 'AWAITING_ADDRESS') return next();

    const address = ctx.message.text.trim();

    // Basic address validation
    if (!isValidAddress(address, session.network)) {
      return ctx.reply(
        `❌ That doesn't look like a valid *${session.network}* address.\n\nPlease check it and try again.`,
        { parse_mode: 'Markdown' }
      );
    }

    try {
      await upsertMerchant(userId, session.network, address);
      onboardingSession.delete(userId);

      await ctx.reply(
        `🎉 *Registration Complete!*\n\n` +
        `Network: \`${session.network}\`\n` +
        `Address: \`${address}\`\n\n` +
        `You can now create invoices with:\n` +
        `/invoice <amount> <description>\n\n` +
        `Example: /invoice 50.00 Website Design Deposit`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('[onboarding] upsertMerchant error:', err);
      await ctx.reply('⚠️ Failed to save your details. Please try again.');
    }
  });
}

function isValidAddress(address: string, network: PayoutNetwork): boolean {
  if (network === 'TRC20') return /^T[A-Za-z0-9]{33}$/.test(address);
  if (network === 'BEP20' || network === 'MATIC')
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  return false;
}
