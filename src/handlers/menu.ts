import { Telegraf, Markup } from 'telegraf';
import { getMerchant } from '../supabase';
import { CONFIG } from '../config';

export function isAdmin(userId: number): boolean {
  return String(userId) === String(CONFIG.ADMIN_CHAT_ID);
}

// Persistent bottom keyboard shown to merchants
const MERCHANT_KEYBOARD = Markup.keyboard([
  ['💼 My Wallet', '📄 Create Invoice'],
  ['📋 My Invoices', '📦 My Orders'],
  ['ℹ️ Help'],
]).resize();

// Admin keyboard
const ADMIN_KEYBOARD = Markup.keyboard([
  ['💼 My Wallet', '📄 Create Invoice'],
  ['📋 My Invoices', '📦 My Orders'],
  ['👑 Admin Dashboard', 'ℹ️ Help'],
]).resize();

// Customer keyboard
const CUSTOMER_KEYBOARD = Markup.keyboard([
  ['🏪 Register as Merchant'],
  ['📦 My Orders', '🧾 My Invoices'],
  ['ℹ️ Help'],
]).resize();

export async function sendMainMenu(ctx: any, userId: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  const admin = isAdmin(userId);

  if (admin) {
    return ctx.reply('👑 *Admin Panel — Vertext Bot*', {
      parse_mode: 'Markdown',
      ...ADMIN_KEYBOARD,
    });
  }

  if (merchant?.payout_address) {
    return ctx.reply('🏦 *Vertext Escrow Bot*

Use the menu below:', {
      parse_mode: 'Markdown',
      ...MERCHANT_KEYBOARD,
    });
  }

  return ctx.reply('🏦 *Vertext Escrow Bot*

Secure crypto escrow & invoicing.

Use the menu below:', {
    parse_mode: 'Markdown',
    ...CUSTOMER_KEYBOARD,
  });
}

export function registerMenuHandlers(bot: Telegraf) {
  bot.command('menu', async (ctx) => {
    await sendMainMenu(ctx, ctx.from!.id);
  });

  // ── Handle keyboard button taps (they come as text messages) ──────────────
  bot.hears('💼 My Wallet', async (ctx) => {
    const { registerWalletHandlers } = await import('./wallet');
    await ctx.reply('Opening wallet…');
    // Trigger wallet menu as inline
    const merchant = await (await import('../supabase')).getMerchant(ctx.from!.id).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.reply('❌ Register as a merchant first.', {
        ...Markup.inlineKeyboard([[Markup.button.callback('🏪 Register', 'register_merchant')]]),
      });
    }
    const { getNetworkFee, calcFees } = await import('../nowpayments');
    const { PayoutNetwork } = await import('../types');
    const networkFee = await getNetworkFee(merchant.payout_network as any);
    const { totalFee } = calcFees(networkFee);
    await ctx.reply(
      `💼 *My Wallet*

💰 Balance: *$${Number(merchant.internal_balance).toFixed(4)} USDT*
🌐 Network: *${merchant.payout_network}*
📬 Address: \`${merchant.payout_address}\`

📊 Fees: ~$${totalFee.toFixed(4)} per withdrawal`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📥 Deposit', 'wallet_deposit'), Markup.button.callback('📤 Withdraw', 'wallet_withdraw')],
          [Markup.button.callback('🔄 Refresh', 'wallet_menu')],
        ]),
      }
    );
  });

  bot.hears('📄 Create Invoice', async (ctx) => {
    const { invoiceSession } = await import('./invoiceMenu');
    invoiceSession.set(ctx.from!.id, { step: 'AWAITING_AMOUNT' });
    await ctx.reply(
      '📄 *Create Invoice — Step 1 of 2*

💵 Reply with the amount in USD:
Example: `50.00`',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'back_to_menu')]]) }
    );
  });

  bot.hears('📋 My Invoices', async (ctx) => {
    const { getInvoicesByMerchant } = await import('../supabase');
    const userId = ctx.from!.id;
    const invoices = await getInvoicesByMerchant(userId, 10).catch(() => []);
    if (!invoices.length) {
      return ctx.reply('📋 *My Invoices*

No invoices yet.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('📄 Create Invoice', 'invoice_start')]]),
      });
    }
    const buttons = invoices.map((inv: any) => [
      Markup.button.callback(`${inv.status === 'PAID' ? '✅' : '⏳'} $${Number(inv.amount_fiat).toFixed(2)} — ${inv.description.slice(0, 20)}`, `view_invoice_${inv.invoice_id}`)
    ]);
    buttons.push([Markup.button.callback('📄 New Invoice', 'invoice_start')]);
    await ctx.reply('📋 *My Invoices*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  });

  bot.hears('📦 My Orders', async (ctx) => {
    await ctx.reply(
      `📦 *My Orders*

Click a merchant payment link to view and pay an order.

Links look like:
\`t.me/${CONFIG.BOT_USERNAME}?start=inv_...\``,
      { parse_mode: 'Markdown' }
    );
  });

  bot.hears('🧾 My Invoices', async (ctx) => {
    await ctx.reply(`📦 Click a merchant's invoice link to pay.
\`t.me/${CONFIG.BOT_USERNAME}?start=inv_...\``);
  });

  bot.hears('🏪 Register as Merchant', async (ctx) => {
    await ctx.reply(
      '📡 *Select your preferred USDT payout network:*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔵 USDT TRC20 (Tron)', 'net_TRC20')],
          [Markup.button.callback('🟡 USDT BEP20 (BSC)', 'net_BEP20')],
          [Markup.button.callback('🟣 USDT Polygon', 'net_MATIC')],
        ]),
      }
    );
  });

  bot.hears('👑 Admin Dashboard', async (ctx) => {
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const [merchants, pendingWds, invoices] = await Promise.all([
      (await import('../supabase')).getAllMerchants().catch(() => []),
      (await import('../supabase')).getPendingWithdrawals().catch(() => []),
      (await import('../supabase')).getAllInvoices().catch(() => []),
    ]);
    const totalBalance = merchants.reduce((s: number, m: any) => s + Number(m.internal_balance), 0);
    const paidInvoices = invoices.filter((i: any) => i.status === 'PAID').length;
    await ctx.reply(
      `👑 *Admin Dashboard*

👥 Merchants: *${merchants.length}*
💰 Total Balance: *$${totalBalance.toFixed(4)} USDT*
📄 Invoices: *${invoices.length}* (${paidInvoices} paid)
⏳ Pending Withdrawals: *${pendingWds.length}*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⏳ Pending Withdrawals', 'admin_pending_wds')],
          [Markup.button.callback('👥 All Merchants', 'admin_merchants'), Markup.button.callback('📄 All Invoices', 'admin_invoices')],
        ]),
      }
    );
  });

  bot.hears('ℹ️ Help', async (ctx) => {
    await ctx.reply(
      `ℹ️ *How Vertext Bot Works*

*For Merchants:*
1\. Register and add your wallet
2\. Create invoices for customers
3\. Share the invoice link
4\. Get paid in USDT automatically
5\. Withdraw to your wallet anytime

*Commands:*
/start — Main menu
/balance — Check balance
/withdraw <amount> — Withdraw funds`,
      { parse_mode: 'MarkdownV2' }
    );
  });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage().catch(() => {});
    await sendMainMenu(ctx, ctx.from!.id);
  });

  bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Use the menu buttons below for navigation.');
  });
}
