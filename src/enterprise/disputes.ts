import { Telegraf, Markup } from 'telegraf';
import { supabase } from '../supabase';
import { CONFIG } from '../config';

export async function openDispute(bot: Telegraf, invoiceId: string, customerTgId: number, reason: string): Promise<void> {
  const { data: invoice, error } = await supabase.from('invoices').select('*').eq('invoice_id', invoiceId).single();
  if (error || !invoice) throw new Error('Invoice not found');
  if (invoice.status !== 'PAID') throw new Error('Can only dispute paid invoices');
  if (invoice.dispute_status !== 'NONE') throw new Error('Dispute already exists');
  const releaseTime = invoice.escrow_release_time ? new Date(invoice.escrow_release_time) : new Date(new Date(invoice.created_at).getTime() + 24 * 60 * 60 * 1000);
  if (new Date() > releaseTime) throw new Error('ESCROW_EXPIRED');
  const { error: lockErr } = await supabase.rpc('lock_balance', { p_telegram_id: invoice.merchant_id, p_amount: invoice.amount_fiat });
  if (lockErr) throw new Error('Failed to lock balance: ' + lockErr.message);
  await supabase.from('invoices').update({ dispute_status: 'OPEN', customer_tg_id: customerTgId }).eq('invoice_id', invoiceId);
  const adminMsg = await bot.telegram.sendMessage(CONFIG.ADMIN_CHAT_ID,
    'DISPUTE OPENED\n\nInvoice: ' + invoiceId + '\nAmount: $' + Number(invoice.amount_fiat).toFixed(2) + ' USD\nMerchant: ' + invoice.merchant_id + '\nCustomer: ' + customerTgId + '\nReason: ' + reason + '\n\nBalance LOCKED. Use buttons to resolve.',
    { ...Markup.inlineKeyboard([[Markup.button.callback('Release to Merchant', 'dispute_release_' + invoiceId), Markup.button.callback('Refund Customer', 'dispute_refund_' + invoiceId)]]) }
  );
  await supabase.from('disputes').insert({ invoice_id: invoiceId, merchant_id: invoice.merchant_id, customer_tg_id: customerTgId, reason, admin_group_message_id: adminMsg.message_id });
  await bot.telegram.sendMessage(invoice.merchant_id, 'Dispute Opened\n\nA customer disputed invoice ' + invoiceId + '\nAmount: $' + Number(invoice.amount_fiat).toFixed(2) + ' USD\nReason: ' + reason + '\n\nYour balance is locked pending admin review.');
}

async function resolveDispute(bot: Telegraf, invoiceId: string, resolution: 'release' | 'refund', adminId: number): Promise<void> {
  const { data: dispute } = await supabase.from('disputes').select('*, invoices(*)').eq('invoice_id', invoiceId).eq('status', 'OPEN').single();
  if (!dispute) throw new Error('No open dispute for invoice ' + invoiceId);
  const amount = Number((dispute.invoices as any).amount_fiat);
  if (resolution === 'release') {
    await supabase.rpc('release_locked_balance', { p_telegram_id: dispute.merchant_id, p_amount: amount });
    await supabase.from('invoices').update({ dispute_status: 'RESOLVED' }).eq('invoice_id', invoiceId);
    await supabase.from('disputes').update({ status: 'RESOLVED_RELEASE', resolved_at: new Date().toISOString(), resolved_by: adminId }).eq('invoice_id', invoiceId);
    await bot.telegram.sendMessage(dispute.merchant_id, 'Dispute Resolved - Funds Released\n\n$' + amount.toFixed(2) + ' USDT restored to your balance.\nInvoice: ' + invoiceId);
    await bot.telegram.sendMessage(dispute.customer_tg_id, 'Dispute Resolved\n\nAdmin reviewed and released funds to the merchant for invoice ' + invoiceId + '.\nContact merchant if you still have issues.');
  } else {
    await supabase.rpc('forfeit_locked_balance', { p_telegram_id: dispute.merchant_id, p_amount: amount });
    await supabase.from('invoices').update({ dispute_status: 'RESOLVED' }).eq('invoice_id', invoiceId);
    await supabase.from('disputes').update({ status: 'RESOLVED_REFUND', resolved_at: new Date().toISOString(), resolved_by: adminId }).eq('invoice_id', invoiceId);
    await bot.telegram.sendMessage(dispute.merchant_id, 'Dispute Resolved - Refund Issued\n\n$' + amount.toFixed(2) + ' USD forfeited from locked balance.\nInvoice: ' + invoiceId);
    await bot.telegram.sendMessage(dispute.customer_tg_id, 'Dispute Resolved - Refund Approved\n\n$' + amount.toFixed(2) + ' USD refund approved for invoice ' + invoiceId + '.\nAdmin will process the crypto refund manually.');
  }
}

export function registerDisputeHandlers(bot: Telegraf) {
  bot.action(/^report_issue_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const invoiceId = ctx.match[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const { data: invoice } = await supabase.from('invoices').select('*').eq('invoice_id', invoiceId).single();
    if (!invoice) return ctx.reply('Invoice not found.');
    if (invoice.dispute_status !== 'NONE') return ctx.reply('A dispute already exists for this invoice.');
    const releaseTime = invoice.escrow_release_time ? new Date(invoice.escrow_release_time) : new Date(new Date(invoice.created_at).getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > releaseTime) return ctx.reply('Escrow window closed. Funds already released to merchant.');
    const timeLeft = Math.round((releaseTime.getTime() - Date.now()) / 60000);
    await ctx.reply('Report an Issue\n\nInvoice: ' + invoiceId + '\nEscrow closes in: ' + timeLeft + ' minutes\n\nSelect your issue:',
      { ...Markup.inlineKeyboard([
        [Markup.button.callback('Item Not Received', 'dreason_' + invoiceId + '_not_received')],
        [Markup.button.callback('Wrong Item/Service', 'dreason_' + invoiceId + '_wrong_item')],
        [Markup.button.callback('Fraud / Scam', 'dreason_' + invoiceId + '_fraud')],
        [Markup.button.callback('Other Issue', 'dreason_' + invoiceId + '_other')],
        [Markup.button.callback('Cancel', 'cancel_dispute')],
      ])}
    );
  });

  bot.action(/^dreason_(.+)_(not_received|wrong_item|fraud|other)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const reasonKey = ctx.match[2];
    const invoiceId = ctx.match[1];
    const reasonMap: Record<string, string> = { not_received: 'Item/Service Not Received', wrong_item: 'Wrong Item Delivered', fraud: 'Fraud or Scam', other: 'Other Issue' };
    await ctx.editMessageText('Opening dispute and locking funds...');
    try {
      await openDispute(bot, invoiceId, userId, reasonMap[reasonKey]);
      await ctx.editMessageText('Dispute Opened\n\nInvoice: ' + invoiceId + '\nReason: ' + reasonMap[reasonKey] + '\n\nMerchant funds are locked. Admin will review within 24 hours.');
    } catch (err: any) {
      if (err.message === 'ESCROW_EXPIRED') await ctx.editMessageText('Escrow window closed. Funds already released.');
      else if (err.message?.includes('already exists')) await ctx.editMessageText('A dispute already exists for this invoice.');
      else { console.error('[dispute]', err); await ctx.editMessageText('Failed to open dispute. Contact admin directly.'); }
    }
  });

  bot.action('cancel_dispute', async (ctx) => { await ctx.answerCbQuery('Cancelled'); await ctx.deleteMessage().catch(() => {}); });

  bot.action(/^dispute_release_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (String(ctx.from?.id) !== String(CONFIG.ADMIN_CHAT_ID)) return ctx.reply('Unauthorized.');
    try { await resolveDispute(bot, ctx.match[1], 'release', ctx.from!.id); await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\nRESOLVED: Funds released to merchant'); }
    catch (err: any) { await ctx.reply('Error: ' + err.message); }
  });

  bot.action(/^dispute_refund_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    if (String(ctx.from?.id) !== String(CONFIG.ADMIN_CHAT_ID)) return ctx.reply('Unauthorized.');
    try { await resolveDispute(bot, ctx.match[1], 'refund', ctx.from!.id); await ctx.editMessageText((ctx.callbackQuery.message as any)?.text + '\n\nRESOLVED: Refund issued to customer'); }
    catch (err: any) { await ctx.reply('Error: ' + err.message); }
  });

  bot.command('resolve_dispute', async (ctx) => {
    if (String(ctx.from?.id) !== String(CONFIG.ADMIN_CHAT_ID)) return ctx.reply('Unauthorized.');
    const parts = ctx.message.text.split(' ');
    if (parts.length < 3) return ctx.reply('Usage: /resolve_dispute <invoice_id> <release|refund>');
    const [, invoiceId, action] = parts;
    if (!['release', 'refund'].includes(action)) return ctx.reply('Action must be release or refund');
    try { await resolveDispute(bot, invoiceId, action as any, ctx.from!.id); await ctx.reply('Dispute resolved: ' + action); }
    catch (err: any) { await ctx.reply('Error: ' + err.message); }
  });
}

export async function releaseExpiredEscrows(): Promise<void> {
  const { data } = await supabase.from('invoices').select('invoice_id').eq('status', 'PAID').eq('dispute_status', 'NONE').lt('escrow_release_time', new Date().toISOString());
  if (!data?.length) return;
  console.log('[escrow] Releasing ' + data.length + ' expired escrows');
  for (const inv of data) {
    await supabase.from('invoices').update({ dispute_status: 'RESOLVED' }).eq('invoice_id', inv.invoice_id);
  }
}
