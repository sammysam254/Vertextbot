import { Telegraf } from 'telegraf';
import { getMerchant, createInvoice } from '../supabase';
import { CONFIG } from '../config';

export function registerInvoiceHandlers(bot: Telegraf) {
  // Usage: /invoice 50.00 Website design deposit
  bot.command('invoice', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // ── Auth check ──────────────────────────────────────────────────────────
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.reply(
        '❌ You must be a registered merchant to create invoices.\n\nUse /start to register.'
      );
    }

    // ── Parse args ──────────────────────────────────────────────────────────
    const args = ctx.message.text.split(' ').slice(1); // remove "/invoice"
    if (args.length < 2) {
      return ctx.reply(
        '⚠️ *Usage:* /invoice <amount> <description>\n\n' +
        'Example: `/invoice 75.00 Logo design deposit`',
        { parse_mode: 'Markdown' }
      );
    }

    const amountRaw = args[0];
    const description = args.slice(1).join(' ');
    const amountFiat = parseFloat(amountRaw);

    if (isNaN(amountFiat) || amountFiat <= 0) {
      return ctx.reply('❌ Invalid amount. Use a positive number like `75.00`', {
        parse_mode: 'Markdown',
      });
    }

    if (amountFiat < 1) {
      return ctx.reply('❌ Minimum invoice amount is $1.00 USD.');
    }

    if (description.length > 200) {
      return ctx.reply('❌ Description must be under 200 characters.');
    }

    // ── Create invoice in DB ─────────────────────────────────────────────────
    try {
      const invoice = await createInvoice(userId, amountFiat, description);
      const deepLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=inv_${invoice.invoice_id}`;

      await ctx.reply(
        `✅ *Invoice Created!*\n\n` +
        `📋 Description: ${description}\n` +
        `💵 Amount: *$${amountFiat.toFixed(2)} USD*\n` +
        `🆔 Invoice ID: \`${invoice.invoice_id}\`\n\n` +
        `📎 *Share this link with your customer:*\n` +
        `[Pay Now ➜](${deepLink})\n\n` +
        `Or send them this raw link:\n\`${deepLink}\``,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    } catch (err) {
      console.error('[invoice] createInvoice error:', err);
      await ctx.reply('⚠️ Failed to create invoice. Please try again.');
    }
  });

  // ── /myinvoices shortcut ─────────────────────────────────────────────────
  bot.command('balance', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant) {
      return ctx.reply('❌ You are not registered as a merchant.');
    }
    await ctx.reply(
      `💰 *Your Balance*\n\n` +
      `Available: *$${Number(merchant.internal_balance).toFixed(4)} USDT*\n` +
      `Network: ${merchant.payout_network}\n` +
      `Address: \`${merchant.payout_address}\`\n\n` +
      `To withdraw, use:\n/withdraw <amount>`,
      { parse_mode: 'Markdown' }
    );
  });
}
