import { Telegraf, Markup } from 'telegraf';
import { isAdmin } from './menu';
import { getAllMerchants, getPendingWithdrawals, getWithdrawal, updateWithdrawalStatus, deductMerchantBalance, getAllInvoices, getMerchant } from '../supabase';

export function registerAdminHandlers(bot: Telegraf) {
  bot.action('admin_dashboard', async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const [merchants, pendingWds, invoices] = await Promise.all([
      getAllMerchants().catch(() => []),
      getPendingWithdrawals().catch(() => []),
      getAllInvoices().catch(() => []),
    ]);
    const totalBalance = merchants.reduce((s: number, m: any) => s + Number(m.internal_balance), 0);
    const paidInvoices = invoices.filter((i: any) => i.status === 'PAID').length;
    await ctx.editMessageText(
      `👑 *Admin Dashboard*\n\n👥 Merchants: *${merchants.length}*\n💰 Total Balance: *$${totalBalance.toFixed(4)} USDT*\n📄 Invoices: *${invoices.length}* (${paidInvoices} paid)\n⏳ Pending Withdrawals: *${pendingWds.length}*`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('⏳ Pending Withdrawals', 'admin_pending_wds')],
        [Markup.button.callback('👥 All Merchants', 'admin_merchants'), Markup.button.callback('📄 All Invoices', 'admin_invoices')],
        [Markup.button.callback('⬅️ Back', 'back_to_menu')],
      ])}
    );
  });

  bot.action('admin_pending_wds', async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const wds = await getPendingWithdrawals().catch(() => []);
    if (!wds.length) return ctx.editMessageText('✅ No pending withdrawals.',
      { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_dashboard')]]) });
    const buttons = wds.map((wd: any) => [
      Markup.button.callback(`⏳ $${Number(wd.net_payout).toFixed(2)} — ID:${wd.merchant_id}`, `admin_view_wd_${wd.withdrawal_id}_${wd.merchant_id}`)
    ]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_dashboard')]);
    await ctx.editMessageText(`⏳ *Pending Withdrawals (${wds.length})*`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
  });

  bot.action(/^admin_view_wd_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const [wd, merchant] = await Promise.all([
      getWithdrawal(ctx.match[1]).catch(() => null),
      getMerchant(parseInt(ctx.match[2])).catch(() => null),
    ]);
    if (!wd) return ctx.editMessageText('❌ Not found.');
    await ctx.editMessageText(
      `🔍 *Withdrawal Review*\n\nMerchant: \`${wd.merchant_id}\`\nNetwork: *${merchant?.payout_network}*\nAddress: \`${merchant?.payout_address}\`\nGross: \`$${Number(wd.amount_requested).toFixed(4)}\`\nNet: \`$${Number(wd.net_payout).toFixed(4)} USDT\`\nStatus: *${wd.status}*`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ APPROVE', `admin_approve_${wd.withdrawal_id}_${wd.merchant_id}`), Markup.button.callback('❌ REJECT', `admin_reject_${wd.withdrawal_id}_${wd.merchant_id}`)],
        [Markup.button.callback('⬅️ Back', 'admin_pending_wds')],
      ])}
    );
  });

  bot.action(/^admin_approve_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const wd = await getWithdrawal(ctx.match[1]).catch(() => null);
    if (!wd) return ctx.reply('❌ Not found.');
    await deductMerchantBalance(parseInt(ctx.match[2]), wd.amount_requested);
    await updateWithdrawalStatus(ctx.match[1], 'COMPLETED');
    await ctx.editMessageText(`✅ Approved. $${Number(wd.net_payout).toFixed(4)} USDT sent to merchant ${ctx.match[2]}.`,
      { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_pending_wds')]]) });
    await bot.telegram.sendMessage(parseInt(ctx.match[2]), `✅ *Withdrawal Approved!*\n\n$${Number(wd.net_payout).toFixed(4)} USDT approved by admin.\nRef: \`${ctx.match[1]}\``, { parse_mode: 'Markdown' });
  });

  bot.action(/^admin_reject_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    await updateWithdrawalStatus(ctx.match[1], 'FAILED');
    await ctx.editMessageText(`❌ Rejected. Balance untouched.`,
      { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_pending_wds')]]) });
    await bot.telegram.sendMessage(parseInt(ctx.match[2]), `❌ *Withdrawal Rejected*\n\nYour balance was not deducted.\nRef: \`${ctx.match[1]}\``, { parse_mode: 'Markdown' });
  });

  bot.action('admin_merchants', async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const merchants = await getAllMerchants().catch(() => []);
    const list = merchants.map((m: any) => `👤 \`${m.telegram_id}\` | ${m.payout_network} | $${Number(m.internal_balance).toFixed(2)}`).join('\n') || 'None yet.';
    await ctx.editMessageText(`👥 *All Merchants (${merchants.length})*\n\n${list}`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_dashboard')]]) });
  });

  bot.action('admin_invoices', async (ctx) => {
    await ctx.answerCbQuery();
    if (!isAdmin(ctx.from!.id)) return ctx.reply('❌ Unauthorized.');
    const invoices = await getAllInvoices(20).catch(() => []);
    const list = invoices.map((i: any) => `${i.status === 'PAID' ? '✅' : '⏳'} $${Number(i.amount_fiat).toFixed(2)} M:${i.merchant_id} — ${i.description.slice(0, 20)}`).join('\n') || 'None yet.';
    await ctx.editMessageText(`📄 *All Invoices*\n\n${list}`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'admin_dashboard')]]) });
  });
}
