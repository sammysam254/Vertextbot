import { Telegraf, Markup } from 'telegraf';
import {
  getMerchant,
  deductMerchantBalance,
  creditMerchantBalance,
  createWithdrawal,
  updateWithdrawalStatus,
  getWithdrawal,
} from '../supabase';
import { createPayout, getNetworkFee, calcFees } from '../nowpayments';
import { CONFIG } from '../config';
import { PayoutNetwork } from '../types';

function escMD(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}

export function registerWithdrawalHandlers(bot: Telegraf) {
  // ─── /withdraw <amount> ──────────────────────────────────────────────────
  bot.command('withdraw', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // ── Auth ──────────────────────────────────────────────────────────────
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) {
      return ctx.reply('❌ You must be a registered merchant to withdraw.\n\nUse /start to register.');
    }

    // ── Parse amount ──────────────────────────────────────────────────────
    const args = ctx.message.text.split(' ').slice(1);
    const amountRaw = parseFloat(args[0] ?? '');

    if (isNaN(amountRaw) || amountRaw <= 0) {
      return ctx.reply(
        `⚠️ *Usage:* /withdraw <amount>\n\nExample: \`/withdraw 45.00\`\n\n💰 Balance: *$${Number(merchant.internal_balance).toFixed(4)} USDT*`,
        { parse_mode: 'Markdown' }
      );
    }

    // ── Fetch live fee ────────────────────────────────────────────────────
    const networkFeeUsd = await getNetworkFee(merchant.payout_network as PayoutNetwork);
    const { networkFee, platformFee, totalFee } = calcFees(networkFeeUsd);
    const netPayout = amountRaw - totalFee;

    if (netPayout <= 0) {
      return ctx.reply(
        `❌ Withdrawal amount too small to cover fees.\n\n` +
        `Network fee: $${networkFee.toFixed(4)}\n` +
        `Platform fee: $${platformFee.toFixed(2)}\n` +
        `Total fees: $${totalFee.toFixed(4)}\n\n` +
        `Minimum withdrawal: $${(totalFee + 0.01).toFixed(2)}`
      );
    }

    // ── Balance check ─────────────────────────────────────────────────────
    if (Number(merchant.internal_balance) < amountRaw) {
      return ctx.reply(
        `❌ Insufficient balance.\n\n` +
        `Requested: $${amountRaw.toFixed(2)}\n` +
        `Available: $${Number(merchant.internal_balance).toFixed(4)}`
      );
    }

    // ── Confirm prompt ────────────────────────────────────────────────────
    const withdrawalRecord = await createWithdrawal(userId, amountRaw, totalFee, netPayout);

    await ctx.reply(
      `📤 *Withdrawal Confirmation*\n\n` +
      `Gross: \`$${amountRaw.toFixed(4)}\`\n` +
      `Network fee \\(${escMD(merchant.payout_network!)}\\): \`$${networkFee.toFixed(4)}\`\n` +
      `Platform fee: \`$${platformFee.toFixed(2)}\`\n` +
      `Total fees: \`$${totalFee.toFixed(4)}\`\n` +
      `─────────────────────\n` +
      `✅ *Net payout: \`$${netPayout.toFixed(4)} USDT\`*\n` +
      `📬 To: \`${merchant.payout_address}\`\n\n` +
      `Confirm this withdrawal?`,
      {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Confirm', `confirm_wd_${withdrawalRecord.withdrawal_id}`),
            Markup.button.callback('❌ Cancel', `cancel_wd_${withdrawalRecord.withdrawal_id}`),
          ],
        ]),
      }
    );
  });

  // ─── Confirm withdrawal callback ─────────────────────────────────────────
  bot.action(/^confirm_wd_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('Processing…');
    const withdrawalId = ctx.match[1];
    const userId = ctx.from?.id;
    if (!userId) return;

    const [withdrawal, merchant] = await Promise.all([
      getWithdrawal(withdrawalId),
      getMerchant(userId),
    ]);

    if (!withdrawal || !merchant) {
      return ctx.editMessageText('⚠️ Could not load withdrawal details. Please try again.');
    }

    if (withdrawal.merchant_id !== userId) {
      return ctx.editMessageText('❌ Unauthorized.');
    }

    await ctx.editMessageText('⏳ Processing your withdrawal…');

    // ── Attempt payout ────────────────────────────────────────────────────
    try {
      const payout = await createPayout(
        merchant.payout_address!,
        merchant.payout_network as PayoutNetwork,
        withdrawal.net_payout,
        withdrawalId
      );

      // ✅ Success path — NOW deduct balance
      await deductMerchantBalance(userId, withdrawal.amount_requested);
      await updateWithdrawalStatus(withdrawalId, 'COMPLETED');

      await ctx.editMessageText(
        `✅ *Withdrawal Successful!*\n\n` +
        `Gross amount: \`$${withdrawal.amount_requested.toFixed(4)}\`\n` +
        `Fees deducted: \`$${withdrawal.fee_deducted.toFixed(4)}\`\n` +
        `Net sent: \`$${withdrawal.net_payout.toFixed(4)} USDT\`\n` +
        `Network: ${merchant.payout_network}\n` +
        `TXID: \`${payout.hash ?? payout.id}\`\n\n` +
        `Funds are on the way! 🚀`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      // ❌ Fail path — do NOT deduct balance
      await updateWithdrawalStatus(withdrawalId, 'MANUAL_REVIEW');

      const errorDetail =
        err?.response?.data
          ? JSON.stringify(err.response.data, null, 2)
          : String(err);

      // Notify merchant with a holding message
      await ctx.editMessageText(
        `⏳ *Withdrawal Under Review*\n\n` +
        `Your withdrawal of \`$${withdrawal.net_payout.toFixed(4)} USDT\` has been flagged for manual review by our admin team.\n\n` +
        `Your balance has *not* been deducted. We'll notify you once it's processed.\n` +
        `Ref: \`${withdrawalId}\``,
        { parse_mode: 'Markdown' }
      );

      // ── Alert admin channel ───────────────────────────────────────────
      const adminMsg =
        `🚨 *WITHDRAWAL FAILED — MANUAL REVIEW REQUIRED*\n\n` +
        `👤 Merchant ID: \`${userId}\`\n` +
        `💰 Gross: \`$${withdrawal.amount_requested.toFixed(4)}\`\n` +
        `💸 Net: \`$${withdrawal.net_payout.toFixed(4)} USDT\`\n` +
        `📬 Address: \`${merchant.payout_address}\`\n` +
        `🌐 Network: ${merchant.payout_network}\n` +
        `🆔 Withdrawal ID: \`${withdrawalId}\`\n\n` +
        `❌ *Error Log:*\n\`\`\`\n${errorDetail.slice(0, 800)}\n\`\`\``;

      await bot.telegram.sendMessage(CONFIG.ADMIN_CHAT_ID, adminMsg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ APPROVE MANUALLY', `admin_approve_${withdrawalId}_${userId}`),
            Markup.button.callback('❌ REJECT & REFUND', `admin_reject_${withdrawalId}_${userId}`),
          ],
        ]),
      });

      console.error(`[withdrawal] payout API failed for ${withdrawalId}:`, errorDetail);
    }
  });

  // ─── Cancel withdrawal ────────────────────────────────────────────────────
  bot.action(/^cancel_wd_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('Cancelled');
    const withdrawalId = ctx.match[1];
    await updateWithdrawalStatus(withdrawalId, 'FAILED').catch(() => {});
    await ctx.editMessageText('❌ Withdrawal cancelled. Your balance is unchanged.');
  });

  // ─── Admin: APPROVE MANUALLY ──────────────────────────────────────────────
  bot.action(/^admin_approve_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Marking as approved…');
    const withdrawalId = ctx.match[1];
    const merchantTgId = parseInt(ctx.match[2], 10);

    const withdrawal = await getWithdrawal(withdrawalId).catch(() => null);
    if (!withdrawal) return ctx.reply('⚠️ Withdrawal record not found.');

    // Deduct balance and mark completed
    await deductMerchantBalance(merchantTgId, withdrawal.amount_requested);
    await updateWithdrawalStatus(withdrawalId, 'COMPLETED');

    await ctx.editMessageText(
      ctx.callbackQuery.message
        ? (ctx.callbackQuery.message as any).text + '\n\n✅ *APPROVED BY ADMIN*'
        : '✅ Withdrawal approved manually.',
      { parse_mode: 'Markdown' }
    );

    // Notify merchant
    await bot.telegram.sendMessage(
      merchantTgId,
      `✅ *Withdrawal Approved*\n\nYour withdrawal of \`$${withdrawal.net_payout.toFixed(4)} USDT\` was manually approved by admin.\n\nRef: \`${withdrawalId}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── Admin: REJECT & REFUND ───────────────────────────────────────────────
  bot.action(/^admin_reject_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Rejecting & refunding…');
    const withdrawalId = ctx.match[1];
    const merchantTgId = parseInt(ctx.match[2], 10);

    await updateWithdrawalStatus(withdrawalId, 'FAILED');

    await ctx.editMessageText(
      ctx.callbackQuery.message
        ? (ctx.callbackQuery.message as any).text + '\n\n❌ *REJECTED BY ADMIN — Balance untouched*'
        : '❌ Withdrawal rejected.',
      { parse_mode: 'Markdown' }
    );

    // Notify merchant
    await bot.telegram.sendMessage(
      merchantTgId,
      `❌ *Withdrawal Rejected*\n\nYour withdrawal request was rejected by admin. Your balance has *not* been deducted.\n\nPlease contact support if you have questions.\nRef: \`${withdrawalId}\``,
      { parse_mode: 'Markdown' }
    );
  });
}
