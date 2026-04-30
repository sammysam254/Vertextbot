-- ============================================================
-- SHOPIFY-IN-A-BOX MIGRATION v3.0
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  product_id   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id  BIGINT        NOT NULL REFERENCES merchants(telegram_id) ON DELETE CASCADE,
  name         TEXT          NOT NULL,
  description  TEXT          NOT NULL DEFAULT '',
  price_usd    NUMERIC(18,2) NOT NULL CHECK (price_usd > 0),
  image_url    TEXT,
  stock_count  INTEGER       NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_merchant  ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_active    ON products(merchant_id, is_active);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  order_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       BIGINT        NOT NULL REFERENCES merchants(telegram_id) ON DELETE CASCADE,
  customer_tg_id    BIGINT        NOT NULL,
  total_amount_usd  NUMERIC(18,2) NOT NULL CHECK (total_amount_usd > 0),
  status            TEXT          NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED')),
  pay_address       TEXT,
  pay_amount        NUMERIC(24,10),
  pay_currency      TEXT,
  now_payment_id    TEXT,
  invoice_id        UUID          REFERENCES invoices(invoice_id),
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant  ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer  ON orders(customer_tg_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  item_id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID          NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id         UUID          NOT NULL REFERENCES products(product_id),
  quantity           INTEGER       NOT NULL CHECK (quantity > 0),
  price_at_checkout  NUMERIC(18,2) NOT NULL CHECK (price_at_checkout > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ─── MERCHANTS: add store slug ────────────────────────────────────────────────
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS store_slug  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS store_name  TEXT,
  ADD COLUMN IF NOT EXISTS store_bio   TEXT;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full_products"    ON products    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_orders"      ON orders      TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_order_items" ON order_items TO service_role USING (true) WITH CHECK (true);

-- Public: customers can read active products
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon
  USING (is_active = true);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STOCK DECREMENT RPC ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
  SET stock_count = GREATEST(0, stock_count - p_qty)
  WHERE product_id = p_product_id;
END; $$;
