import { Telegraf, Markup } from 'telegraf';
import { getMerchant, upsertMerchant } from '../supabase';
import { PayoutNetwork } from '../types';

const onboardingSession = new Map<number, { step: 'AWAITING_ADDRESS'; network: PayoutNetwork }>();

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
  bot.action('register_merchant', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📡 *Select your preferred USDT payout network:*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(NETWORK_LABELS.TRC20, 'net_TRC20')],
          [Markup.button.callback(NETWORK_LABELS.BEP20, 'net_BEP20')],
          [Markup.button.callback(NETWORK_LABELS.MATIC, 'net_MATIC')],
          [Markup.button.callback('⬅️ Back', 'back_to_menu')],
        ]),
      }
    );
  });

  for (const network of ['TRC20', 'BEP20', 'MATIC'] as PayoutNetwork[]) {
    bot.action(`net_${network}`, async (ctx) => {
      await ctx.answerCbQuery();
      const userId = ctx.from?.id;
      if (!userId) return;
      onboardingSession.set(userId, { step: 'AWAITING_ADDRESS', network });
      await ctx.editMessageText(
        `✅ Network: *${NETWORK_LABELS[network]}*\n\nReply with your *${network} wallet address*.\nExample: \`${NETWORK_EXAMPLE_ADDR[network]}\`\n\n⚠️ Double-check — wrong addresses are unrecoverable.`,
        { parse_mode: 'Markdown' }
      );
    });
  }

  bot.on('text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();
    const session = onboardingSession.get(userId);
    if (!session || session.step !== 'AWAITING_ADDRESS') return next();
    const address = ctx.message.text.trim();
    if (!isValidAddress(address, session.network)) {
      return ctx.reply(`❌ Invalid *${session.network}* address. Please check and try again.`, { parse_mode: 'Markdown' });
    }
    try {
      await upsertMerchant(userId, session.network, address);
      onboardingSession.delete(userId);
      await ctx.reply(
        `🎉 *Registration Complete!*\n\nNetwork: \`${session.network}\`\nAddress: \`${address}\`\n\nUse the menu to create invoices and manage your wallet.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Main Menu', 'back_to_menu')],
          ]),
        }
      );
    } catch (err) {
      console.error('[onboarding] error:', err);
      await ctx.reply('⚠️ Failed to save your details. Please try again.');
    }
  });
}

function isValidAddress(address: string, network: PayoutNetwork): boolean {
  if (network === 'TRC20') return /^T[A-Za-z0-9]{33}$/.test(address);
  if (network === 'BEP20' || network === 'MATIC') return /^0x[0-9a-fA-F]{40}$/.test(address);
  return false;
}
