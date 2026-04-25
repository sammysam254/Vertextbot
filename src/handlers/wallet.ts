import { Telegraf, Markup } from 'telegraf';
import { getMerchant, createWithdrawal, updateWithdrawalStatus, deductMerchantBalance } from '../supabase';
import { getNetworkFee, calcFees, createPayout } from '../nowpayments';
import { CONFIG } from '../config';
import { PayoutNetwork } from '../types';

export const withdrawSession = new Map<number, { step: 'AWAITING_AMOUNT' }>();

export function registerWalletHandlers(bot: Telegraf) {
  bot.action('wallet_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from!.id;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.editMessageText('❌ Register as a merchant to access your wallet.',
        { ...Markup.inlineKeyboard([[Markup.button.callback('🏪 Register', 'register_merchant'), Markup.button.callback('⬅️ Back', 'back_to_menu')]]) });
    }
    const balance = Number(merchant.internal_balance).toFixed(4);
    const networkFee = await getNetworkFee(merchant.payout_network as PayoutNetwork);
    const { totalFee } = calcFees(networkFee);
    await ctx.editMessageText(
      `💼 *My Wallet*\n\n💰 Balance: *$${balance} USDT*\n🌐 Network: *${merchant.payout_network}*\n📬 Address: \`${merchant.payout_address}\`\n\n📊 Fees: ~$${totalFee.toFixed(4)} per withdrawal`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('📥 Deposit', 'wallet_deposit'), Markup.button.callback('📤 Withdraw', 'wallet_withdraw')],
        [Markup.button.callback('🔄 Refresh', 'wallet_menu')],
        [Markup.button.callback('⬅️ Back to Menu', 'back_to_menu')],
      ])}
    );
  });

  bot.action('wallet_deposit', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `📥 *How to Deposit*\n\nYour wallet is funded when customers pay your invoices.\n\n1️⃣ Create an invoice\n2️⃣ Share link with customer\n3️⃣ Customer pays\n4️⃣ Balance updates automatically`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📄 Create Invoice', 'invoice_start'), Markup.button.callback('⬅️ Back', 'wallet_menu')]]) }
    );
  });

  bot.action('wallet_withdraw', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from!.id;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.editMessageText('❌ Register first.');
    const balance = Number(merchant.internal_balance);
    if (balance <= 0) {
      return ctx.editMessageText('❌ No balance to withdraw.',
        { ...Markup.inlineKeyboard([[Markup.button.callback('📄 Create Invoice', 'invoice_start'), Markup.button.callback('⬅️ Back', 'wallet_menu')]]) });
    }
    withdrawSession.set(userId, { step: 'AWAITING_AMOUNT' });
    await ctx.editMessageText(
      `📤 *Withdraw Funds*\n\n💰 Available: *$${balance.toFixed(4)} USDT*\n📬 To: \`${merchant.payout_address}\`\n\nReply with the amount to withdraw:`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback(`💰 Withdraw All ($${balance.toFixed(4)})`, `withdraw_all_${balance.toFixed(4)}`)],
        [Markup.button.callback('❌ Cancel', 'wallet_menu')],
      ])}
    );
  });

  bot.action(/^withdraw_all_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from!.id;
    withdrawSession.delete(userId);
    await handleWithdrawAmount(bot, ctx, userId, parseFloat(ctx.match[1]));
  });
}

export async function handleWithdrawAmount(bot: Telegraf, ctx: any, userId: number, amount: number) {
  const merchant = await getMerchant(userId).catch(() => null);
  if (!merchant?.payout_address) return ctx.reply('❌ Register first.');
  const networkFee = await getNetworkFee(merchant.payout_network as PayoutNetwork);
  const { networkFee: nf, platformFee, totalFee } = calcFees(networkFee);
  const netPayout = amount - totalFee;
  if (netPayout <= 0) return ctx.reply(`❌ Amount too small. Min: $${(totalFee + 0.01).toFixed(2)}`);
  if (Number(merchant.internal_balance) < amount) return ctx.reply(`❌ Insufficient balance. Available: $${Number(merchant.internal_balance).toFixed(4)}`);
  const withdrawal = await createWithdrawal(userId, amount, totalFee, netPayout);
  await ctx.reply(
    `📤 *Withdrawal Confirmation*\n\nGross: \`$${amount.toFixed(4)}\`\nNetwork fee: \`$${nf.toFixed(4)}\`\nPlatform fee: \`$${platformFee.toFixed(2)}\`\n─────────────────\n✅ Net payout: \`$${netPayout.toFixed(4)} USDT\`\n📬 To: \`${merchant.payout_address}\`\n🌐 Network: ${merchant.payout_network}`,
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm', `confirm_wd_${withdrawal.withdrawal_id}`), Markup.button.callback('❌ Cancel', `cancel_wd_${withdrawal.withdrawal_id}`)],
    ])}
  );
}
