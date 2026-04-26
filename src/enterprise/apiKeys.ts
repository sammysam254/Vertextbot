import { Telegraf, Markup } from 'telegraf';
import crypto from 'crypto';
import { supabase, getMerchant } from '../supabase';

function generateApiKey(): string { return 'vxt_' + crypto.randomBytes(24).toString('hex'); }

export function registerApiKeyHandlers(bot: Telegraf) {
  bot.command('apikey', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    if ((merchant as any).api_key) {
      return ctx.reply('Your API Key:\n\n' + (merchant as any).api_key + '\n\nTo set webhook: /setwebhook <url>',
        { ...Markup.inlineKeyboard([[Markup.button.callback('Regenerate Key', 'regen_api_key')]]) });
    }
    const newKey = generateApiKey();
    await supabase.from('merchants').update({ api_key: newKey }).eq('telegram_id', userId);
    await ctx.reply('API Key Generated:\n\n' + newKey + '\n\nSave this — use it to verify webhook signatures.');
  });

  bot.action('regen_api_key', async (ctx) => {
    await ctx.answerCbQuery('Generating key...');
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first.');
    const newKey = generateApiKey();
    await supabase.from('merchants').update({ api_key: newKey }).eq('telegram_id', userId);
    await ctx.reply(
      '🔑 *API Key Generated!*\n\n`' + newKey + '`\n\n' +
      'Use this to:\n' +
      '• Login to the web dashboard\n' +
      '• Authenticate API requests\n' +
      '• Verify webhook signatures\n\n' +
      '⚠️ Keep this secret — it grants full access to your account.',
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
    await ctx.reply('Webhook URL set:\n' + url + '\n\nVertext will POST payment events to this URL.');
  });

  bot.command('removewebhook', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await supabase.from('merchants').update({ webhook_url: null }).eq('telegram_id', userId);
    await ctx.reply('Webhook URL removed.');
  });
}
