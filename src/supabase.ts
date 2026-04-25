import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';
import { Merchant, Invoice, Withdrawal, PayoutNetwork, WithdrawalStatus } from './types';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

// ─── Merchants ────────────────────────────────────────────────────────────────

export async function getMerchant(telegramId: number): Promise<Merchant | null> {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data ?? null;
}

export async function upsertMerchant(
  telegramId: number,
  network: PayoutNetwork,
  address: string
): Promise<Merchant> {
  const { data, error } = await supabase
    .from('merchants')
    .upsert(
      { telegram_id: telegramId, payout_network: network, payout_address: address },
      { onConflict: 'telegram_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deductMerchantBalance(
  telegramId: number,
  gross: number
): Promise<void> {
  // Atomic RPC to prevent race conditions
  const { error } = await supabase.rpc('deduct_balance', {
    p_telegram_id: telegramId,
    p_amount: gross,
  });
  if (error) throw error;
}

export async function creditMerchantBalance(
  telegramId: number,
  amount: number
): Promise<void> {
  const { error } = await supabase.rpc('credit_balance', {
    p_telegram_id: telegramId,
    p_amount: amount,
  });
  if (error) throw error;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function createInvoice(
  merchantId: number,
  amountFiat: number,
  description: string
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({ merchant_id: merchantId, amount_fiat: amountFiat, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_id', invoiceId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function markInvoicePaid(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'PAID' })
    .eq('invoice_id', invoiceId);
  if (error) throw error;
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function createWithdrawal(
  merchantId: number,
  amountRequested: number,
  feeDeducted: number,
  netPayout: number
): Promise<Withdrawal> {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      merchant_id: merchantId,
      amount_requested: amountRequested,
      fee_deducted: feeDeducted,
      net_payout: netPayout,
      status: 'PENDING',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: WithdrawalStatus
): Promise<void> {
  const { error } = await supabase
    .from('withdrawals')
    .update({ status })
    .eq('withdrawal_id', withdrawalId);
  if (error) throw error;
}

export async function getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('withdrawal_id', withdrawalId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}
