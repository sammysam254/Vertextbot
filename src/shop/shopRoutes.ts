import { Router, Request, Response } from 'express';
import axios from 'axios';
import QRCode from 'qrcode';
import { supabase } from '../supabase';
import { CONFIG } from '../config';
import {
  createProduct, updateProduct, getMerchantProducts,
  getStoreProducts, createOrder, getMerchantOrders,
  getMerchantBySlug, getProductById, CartItem,
} from './shopDb';

const router = Router();

// ── Auth middleware (reuse existing pattern) ───────────────────────────────────
async function shopAuth(req: Request, res: Response): Promise<{ merchant: any } | null> {
  const merchantId = parseInt(
    (req.headers['x-merchant-id'] as string) ?? (req.query.user_id as string), 10
  );
  const apiKey = (req.headers['x-api-key'] as string) ?? (req.query.api_key as string);
  if (!merchantId || isNaN(merchantId)) {
    res.status(400).json({ error: 'Missing X-Merchant-Id' });
    return null;
  }
  const { data: merchant } = await supabase.from('merchants').select('*').eq('telegram_id', merchantId).single();
  if (!merchant) { res.status(404).json({ error: 'Merchant not found' }); return null; }
  if (apiKey !== 'tg_auth' && merchant.api_key !== apiKey) {
    res.status(401).json({ error: 'Invalid API key' });
    return null;
  }
  return { merchant };
}

// ─── GET /api/merchant/dashboard ──────────────────────────────────────────────
router.get('/merchant/dashboard', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;

  const [productsRes, ordersRes, invoicesRes] = await Promise.all([
    supabase.from('products').select('*').eq('merchant_id', auth.merchant.telegram_id),
    supabase.from('orders').select('*').eq('merchant_id', auth.merchant.telegram_id),
    supabase.from('invoices').select('*').eq('merchant_id', auth.merchant.telegram_id),
  ]);

  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];
  const paidOrders = orders.filter((o: any) => o.status === 'PAID');
  const totalRevenue = paidOrders.reduce((s: number, o: any) => s + Number(o.total_amount_usd), 0);

  res.json({
    merchant: auth.merchant,
    stats: {
      balance: Number(auth.merchant.internal_balance),
      locked: Number(auth.merchant.locked_amount ?? 0),
      total_orders: orders.length,
      paid_orders: paidOrders.length,
      pending_orders: orders.filter((o: any) => o.status === 'PENDING').length,
      total_revenue: totalRevenue,
      active_products: products.filter((p: any) => p.is_active).length,
      total_products: products.length,
    },
    recent_orders: orders.slice(0, 10),
    products,
  });
});

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/products', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;
  const { name, description, price_usd, image_url, stock_count } = req.body;
  if (!name || !price_usd) return res.status(400).json({ error: 'name and price_usd are required' });
  if (parseFloat(price_usd) <= 0) return res.status(400).json({ error: 'price must be positive' });
  try {
    const product = await createProduct(auth.merchant.telegram_id, {
      name: String(name).slice(0, 100),
      description: String(description ?? '').slice(0, 500),
      price_usd: parseFloat(price_usd),
      image_url: image_url ?? null,
      stock_count: parseInt(stock_count ?? 0),
    });
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
router.put('/products/:id', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;
  const { name, description, price_usd, stock_count, is_active, image_url } = req.body;
  try {
    const updates: any = {};
    if (name !== undefined) updates.name = String(name).slice(0, 100);
    if (description !== undefined) updates.description = String(description).slice(0, 500);
    if (price_usd !== undefined) updates.price_usd = parseFloat(price_usd);
    if (stock_count !== undefined) updates.stock_count = parseInt(stock_count);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (image_url !== undefined) updates.image_url = image_url;
    const product = await updateProduct(req.params.id, auth.merchant.telegram_id, updates);
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/store/:merchant_id — PUBLIC ─────────────────────────────────────
router.get('/store/:merchant_id', async (req: Request, res: Response) => {
  const merchantId = parseInt(req.params.merchant_id, 10);
  if (isNaN(merchantId)) {
    // Try slug lookup
    const merchant = await getMerchantBySlug(req.params.merchant_id).catch(() => null);
    if (!merchant) return res.status(404).json({ error: 'Store not found' });
    const products = await getStoreProducts(merchant.telegram_id);
    return res.json({
      merchant: { telegram_id: merchant.telegram_id, store_name: merchant.store_name ?? 'Store', store_bio: merchant.store_bio ?? '', store_slug: merchant.store_slug },
      products,
    });
  }
  const { data: merchant } = await supabase.from('merchants').select('telegram_id,store_name,store_bio,store_slug,payout_network').eq('telegram_id', merchantId).single();
  if (!merchant) return res.status(404).json({ error: 'Store not found' });
  const products = await getStoreProducts(merchantId);
  res.json({
    merchant: { telegram_id: merchant.telegram_id, store_name: merchant.store_name ?? 'Store #' + merchantId, store_bio: merchant.store_bio ?? '', store_slug: merchant.store_slug },
    products,
  });
});

// ─── POST /api/checkout ───────────────────────────────────────────────────────
router.post('/checkout', async (req: Request, res: Response) => {
  const { merchant_id, customer_tg_id, cart, pay_currency } = req.body;

  if (!merchant_id || !customer_tg_id || !cart?.length) {
    return res.status(400).json({ error: 'merchant_id, customer_tg_id and cart are required' });
  }

  // Validate cart items and compute total
  let totalUsd = 0;
  const validatedItems: CartItem[] = [];

  for (const item of cart) {
    const product = await getProductById(item.product_id).catch(() => null);
    if (!product || !product.is_active) {
      return res.status(400).json({ error: `Product ${item.product_id} not found or inactive` });
    }
    if (product.stock_count < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
    }
    const lineTotal = product.price_usd * item.quantity;
    totalUsd += lineTotal;
    validatedItems.push({
      product_id: product.product_id,
      quantity: item.quantity,
      price_at_checkout: product.price_usd,
      name: product.name,
    });
  }

  totalUsd = parseFloat(totalUsd.toFixed(2));
  const currency = pay_currency ?? 'usdttrc20';

  // Create NOWPayments deposit
  let payment: any;
  try {
    const tempOrderId = 'order_' + Date.now();
    const { data } = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: totalUsd,
        price_currency: 'usd',
        pay_currency: currency,
        order_id: tempOrderId,
        order_description: `Store order - ${validatedItems.length} item(s)`,
        ipn_callback_url: `${CONFIG.WEBHOOK_DOMAIN}/webhook/nowpayments`,
      },
      { headers: { 'x-api-key': CONFIG.NOW_API_KEY } }
    );
    payment = data;
  } catch (err: any) {
    console.error('[checkout] NOWPayments error:', err?.response?.data ?? err.message);
    return res.status(502).json({ error: 'Payment gateway error. Try again.' });
  }

  // Create invoice record
  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      merchant_id,
      amount_fiat: totalUsd,
      description: `Store order: ${validatedItems.map(i => i.name).join(', ')}`.slice(0, 200),
      now_payment_id: payment.payment_id,
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      customer_tg_id,
    })
    .select().single();

  // Create order record
  const order = await createOrder(
    parseInt(merchant_id),
    parseInt(customer_tg_id),
    totalUsd,
    validatedItems,
    {
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      now_payment_id: payment.payment_id,
      invoice_id: invoice?.invoice_id ?? '',
    }
  );

  // Generate QR code buffer
  let qrBase64 = '';
  try {
    const qrBuf = await QRCode.toBuffer(payment.pay_address, { type: 'png', width: 350, margin: 2 });
    qrBase64 = qrBuf.toString('base64');
  } catch {}

  res.json({
    order_id: order.order_id,
    invoice_id: invoice?.invoice_id,
    total_usd: totalUsd,
    pay_address: payment.pay_address,
    pay_amount: payment.pay_amount,
    pay_currency: payment.pay_currency,
    qr_base64: qrBase64,
    expires_in_minutes: 20,
  });
});

// ─── GET /api/orders — merchant's order list ──────────────────────────────────
router.get('/orders', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;
  const orders = await getMerchantOrders(auth.merchant.telegram_id);
  res.json({ orders });
});

// ─── PUT /api/orders/:id/ship ─────────────────────────────────────────────────
router.put('/orders/:id/ship', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;
  const { data: order } = await supabase.from('orders').select('*').eq('order_id', req.params.id).eq('merchant_id', auth.merchant.telegram_id).single();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'PAID') return res.status(400).json({ error: 'Can only ship paid orders' });
  await supabase.from('orders').update({ status: 'SHIPPED' }).eq('order_id', req.params.id);
  res.json({ message: 'Order marked as shipped' });
});

// ─── POST /api/store/setup — set slug / store name ────────────────────────────
router.post('/store/setup', async (req: Request, res: Response) => {
  const auth = await shopAuth(req, res);
  if (!auth) return;
  const { store_name, store_bio, store_slug } = req.body;
  if (!store_slug || !/^[a-z0-9_]{3,30}$/.test(store_slug)) {
    return res.status(400).json({ error: 'Slug must be 3-30 lowercase letters, numbers, or underscores' });
  }
  try {
    await supabase.from('merchants').update({ store_name, store_bio, store_slug }).eq('telegram_id', auth.merchant.telegram_id);
    res.json({ store_url: `https://t.me/${CONFIG.BOT_USERNAME}/store?startapp=${store_slug}` });
  } catch (err: any) {
    if (err.message?.includes('unique')) return res.status(409).json({ error: 'Slug already taken' });
    res.status(500).json({ error: err.message });
  }
});


// ─── GET /api/payment-status/:invoiceId ───────────────────────────────────────
router.get('/payment-status/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('status, now_payment_id, paid_currency, paid_crypto_amount, txid')
      .eq('invoice_id', req.params.invoiceId)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found', status: 'unknown' });

    // If already paid in our DB
    if (invoice.status === 'PAID') {
      return res.json({ status: 'finished', txid: invoice.txid, currency: invoice.paid_currency, amount: invoice.paid_crypto_amount });
    }

    // Check live from NOWPayments if we have a payment_id
    if (invoice.now_payment_id) {
      try {
        const { data } = await axios.get(`https://api.nowpayments.io/v1/payment/${invoice.now_payment_id}`, {
          headers: { 'x-api-key': CONFIG.NOW_API_KEY },
        });
        return res.json({
          status: data.payment_status,
          txid: data.payin_hash || null,
          currency: data.pay_currency,
          amount: data.actually_paid || data.pay_amount,
        });
      } catch {
        // NOWPayments unreachable - return DB status
      }
    }

    return res.json({ status: invoice.status === 'PAID' ? 'finished' : 'waiting' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, status: 'unknown' });
  }
});

export default router;
