import { Telegraf, Markup } from 'telegraf';
import { Parser } from 'json2csv';
import { supabase } from '../supabase';

async function getExportData(merchantId: number) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();
  const [invRes, wdRes] = await Promise.all([
    supabase.from('invoices').select('invoice_id,amount_fiat,status,description,paid_currency,paid_crypto_amount,txid,created_at,dispute_status').eq('merchant_id', merchantId).gte('created_at', sinceIso).order('created_at', { ascending: false }),
    supabase.from('withdrawals').select('withdrawal_id,amount_requested,fee_deducted,net_payout,status,created_at').eq('merchant_id', merchantId).gte('created_at', sinceIso).order('created_at', { ascending: false }),
  ]);
  return { invoices: invRes.data ?? [], withdrawals: wdRes.data ?? [] };
}

function buildCSV(invoices: any[], withdrawals: any[]): Buffer {
  const invParser = new Parser({ fields: ['invoice_id','description','amount_fiat','status','paid_currency','paid_crypto_amount','txid','dispute_status','created_at'] });
  const wdParser = new Parser({ fields: ['withdrawal_id','amount_requested','fee_deducted','net_payout','status','created_at'] });
  const totalEarned = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.amount_fiat), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + Number(w.net_payout), 0);
  const lines = [
    'VERTEXT ESCROW BOT - ACCOUNTING EXPORT',
    'Generated: ' + new Date().toUTCString(),
    'Period: Last 30 days',
    '',
    '=== SUMMARY ===',
    'Total Invoices,' + invoices.length,
    'Paid Invoices,' + invoices.filter(i => i.status === 'PAID').length,
    'Total Earned (USD),$' + totalEarned.toFixed(2),
    'Total Withdrawn (USD),$' + totalWithdrawn.toFixed(2),
    '',
    '=== INVOICES ===',
    invoices.length ? invParser.parse(invoices) : 'No invoices',
    '',
    '=== WITHDRAWALS ===',
    withdrawals.length ? wdParser.parse(withdrawals) : 'No withdrawals',
  ].join('\n');
  return Buffer.from(lines, 'utf-8');
}

export function registerExportHandlers(bot: Telegraf) {
  bot.command('export', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.reply('Generating your accounting report...');
    try {
      const { invoices, withdrawals } = await getExportData(userId);
      if (!invoices.length && !withdrawals.length) return ctx.reply('No data found for the last 30 days.');
      const csv = buildCSV(invoices, withdrawals);
      const filename = 'vertext_export_' + userId + '_' + new Date().toISOString().slice(0, 10) + '.csv';
      await ctx.replyWithDocument({ source: csv, filename }, { caption: 'Accounting Export\nPeriod: Last 30 days\nInvoices: ' + invoices.length + '\nWithdrawals: ' + withdrawals.length });
    } catch (err) { console.error('[export]', err); await ctx.reply('Export failed. Please try again.'); }
  });

  bot.action('export_csv', async (ctx) => {
    await ctx.answerCbQuery('Generating...');
    const userId = ctx.from?.id;
    if (!userId) return;
    try {
      const { invoices, withdrawals } = await getExportData(userId);
      const csv = buildCSV(invoices, withdrawals);
      const filename = 'vertext_export_' + userId + '_' + new Date().toISOString().slice(0, 10) + '.csv';
      await ctx.replyWithDocument({ source: csv, filename }, { caption: 'Your accounting export is ready.' });
    } catch (err) { await ctx.reply('Export failed.'); }
  });
}
