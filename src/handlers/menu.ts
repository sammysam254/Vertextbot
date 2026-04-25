import { Telegraf, Markup } from 'telegraf';
import { getMerchant } from '../supabase';
import { CONFIG } from '../config';

export function isAdmin(userId: number): boolean {
  return String(userId) === String(CONFIG.ADMIN_CHAT_ID);
}

export async function sendMainMenu(ctx: any, userId: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  const admin = isAdmin(userId);

  if (admin) {
    return ctx.reply(
      `👑 *Admin Panel — Vertext Bot*\n\nWelcome back, Admin!`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('👑 Admin Dashboard', 'admin_dashboard')],
          [Markup.button.callback('💼 My Wallet', 'wallet_menu'), Markup.button.callback('📄 Create Invoice', 'invoice_start')],
          [Markup.button.callback('📋 My Invoices', 'my_invoices'), Markup.button.callback('📦 My Orders', 'my_orders')],
        ]),
      }
    );
  }

  if (merchant?.payout_address) {
    return ctx.reply(
      `🏦 *Vertext Escrow Bot*\n\nWelcome back! Manage your business below.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💼 My Wallet', 'wallet_menu')],
          [Markup.button.callback('📄 Create Invoice', 'invoice_start')],
          [Markup.button.callback('📋 My Invoices', 'my_invoices')],
          [Markup.button.callback('📦 My Orders', 'my_orders')],
          [Markup.button.callback('ℹ️ Help', 'show_help')],
        ]),
      }
    );
  }

  return ctx.reply(
    `🏦 *Vertext Escrow Bot*\n\nSecure crypto escrow & invoicing platform.\n\nWhat would you like to do?`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏪 Register as Merchant', 'register_merchant')],
        [Markup.button.callback('📦 My Orders', 'my_orders')],
        [Markup.button.callback('🧾 My Invoices', 'my_invoices')],
        [Markup.button.callback('ℹ️ Help', 'show_help')],
      ]),
    }
  );
}

export function registerMenuHandlers(bot: Telegraf) {
  bot.command('menu', async (ctx) => {
    await sendMainMenu(ctx, ctx.from!.id);
  });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await sendMainMenu(ctx, ctx.from!.id);
  });

  bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `ℹ️ *How Vertext Bot Works*\n\n*For Merchants:*\n1. Register and add your wallet\n2. Create invoices for customers\n3. Share the invoice link\n4. Get paid in USDT automatically\n5. Withdraw to your wallet anytime\n\n*Commands:*\n/start — Main menu\n/balance — Check balance\n/withdraw <amount> — Withdraw funds`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back to Menu', 'back_to_menu')]]),
      }
    );
  });
}
