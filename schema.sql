-- ============================================================
-- ESCROW BOT — SUPABASE SQL SCHEMA
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── MERCHANTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
  telegram_id       BIGINT      PRIMARY KEY,
  internal_balance  NUMERIC(18,6) NOT NULL DEFAULT 0 CHECK (internal_balance >= 0),
  payout_address    TEXT,
  payout_network    TEXT        CHECK (payout_network IN ('TRC20', 'BEP20', 'MATIC')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INVOICES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id  BIGINT      NOT NULL REFERENCES merchants(telegram_id) ON DELETE CASCADE,
  amount_fiat  NUMERIC(18,2) NOT NULL CHECK (amount_fiat > 0),
  description  TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'PAID')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_merchant ON invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);

-- ─── WITHDRAWALS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  withdrawal_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id      BIGINT      NOT NULL REFERENCES merchants(telegram_id) ON DELETE CASCADE,
  amount_requested NUMERIC(18,6) NOT NULL CHECK (amount_requested > 0),
  fee_deducted     NUMERIC(18,6) NOT NULL CHECK (fee_deducted >= 0),
  net_payout       NUMERIC(18,6) NOT NULL CHECK (net_payout > 0),
  status           TEXT        NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_merchant ON withdrawals(merchant_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status   ON withdrawals(status);

-- ─── ATOMIC BALANCE RPCs ─────────────────────────────────────────────────────
-- These run inside a transaction so concurrent requests never cause double-spend

CREATE OR REPLACE FUNCTION deduct_balance(p_telegram_id BIGINT, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE merchants
  SET    internal_balance = internal_balance - p_amount
  WHERE  telegram_id = p_telegram_id
    AND  internal_balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or merchant not found for id=%', p_telegram_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION credit_balance(p_telegram_id BIGINT, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO merchants (telegram_id, internal_balance)
  VALUES (p_telegram_id, p_amount)
  ON CONFLICT (telegram_id)
  DO UPDATE SET internal_balance = merchants.internal_balance + EXCLUDED.internal_balance;
END;
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Service role key bypasses RLS, so these policies apply only to anon/user keys
ALTER TABLE merchants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by your bot backend)
CREATE POLICY "service_full_merchants"   ON merchants   TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_invoices"    ON invoices    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_withdrawals" ON withdrawals TO service_role USING (true) WITH CHECK (true);

-- Public: invoices are readable by anyone with the UUID (for customer checkout)
CREATE POLICY "public_read_invoices" ON invoices FOR SELECT TO anon USING (true);
