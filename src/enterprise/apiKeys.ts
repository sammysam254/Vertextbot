import { Telegraf, Markup } from 'telegraf';
import crypto from 'crypto';
import { supabase, getMerchant } from '../supabase';

function generateApiKey(): string { return 'vxt_' + crypto.randomBytes(24).toString('hex'); }

export function registerApiKeyHandlers(bot: Telegraf) {

  // /apikey command
  bot.command('apikey', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const newKey = generateApiKey();
    await supabase.from('merchants').update({ api_key: newKey }).eq('telegram_id', userId);
    await ctx.reply(
      '🔑 *API Key*\n\n`' + newKey + '`\n\nUse this to login at the web dashboard and authenticate API requests.\n\n⚠️ Keep it secret.',
      { parse_mode: 'Markdown' }
    );
  });

  // Generate API Key button (from API Settings menu)
  bot.action('regen_api_key', async (ctx) => {
    await ctx.answerCbQuery('Generating...');
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const newKey = generateApiKey();
    const { error } = await supabase.from('merchants').update({ api_key: newKey }).eq('telegram_id', userId);
    if (error) {
      console.error('[apikey] supabase error:', error);
      return ctx.reply('Failed to generate key. Try /apikey command instead.');
    }
    await ctx.reply(
      '🔑 *New API Key Generated*\n\n`' + newKey + '`\n\nUse this to:\n• Login to web dashboard\n• Authenticate API requests\n• Verify webhook signatures\n\n⚠️ Old key is now invalid.',
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('setwebhook', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const url = ctx.message.text.split(' ')[1]?.trim();
    if (!url || !url.startsWith('https://')) return ctx.reply('Usage: /setwebhook https://yoursite.com/webhook\n\nMust use HTTPS.');
    await supabase.from('merchants').update({ webhook_url: url }).eq('telegram_id', userId);
    await ctx.reply('Webhook URL set:\n' + url);
  });

  bot.command('removewebhook', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await supabase.from('merchants').update({ webhook_url: null }).eq('telegram_id', userId);
    await ctx.reply('Webhook URL removed.');
  });
}
