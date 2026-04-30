import { supabase } from '../supabase';

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
  product_id: string;
  merchant_id: number;
  name: string;
  description: string;
  price_usd: number;
  image_url: string | null;
  stock_count: number;
  is_active: boolean;
  created_at: string;
}

export async function createProduct(
  merchantId: number,
  data: { name: string; description: string; price_usd: number; image_url?: string; stock_count?: number }
): Promise<Product> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({ merchant_id: merchantId, ...data })
    .select()
    .single();
  if (error) throw error;
  return product;
}

export async function updateProduct(
  productId: string,
  merchantId: number,
  updates: Partial<Pick<Product, 'name' | 'description' | 'price_usd' | 'stock_count' | 'is_active' | 'image_url'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('product_id', productId)
    .eq('merchant_id', merchantId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMerchantProducts(merchantId: number, activeOnly = false): Promise<Product[]> {
  let q = supabase.from('products').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getStoreProducts(merchantId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products').select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .gt('stock_count', 0)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('product_id', productId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  order_id: string;
  merchant_id: number;
  customer_tg_id: number;
  total_amount_usd: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';
  pay_address: string | null;
  pay_amount: number | null;
  pay_currency: string | null;
  now_payment_id: string | null;
  invoice_id: string | null;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price_at_checkout: number;
  name: string;
}

export async function createOrder(
  merchantId: number,
  customerTgId: number,
  totalUsd: number,
  items: CartItem[],
  paymentDetails: { pay_address: string; pay_amount: number; pay_currency: string; now_payment_id: string; invoice_id: string }
): Promise<Order> {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      merchant_id: merchantId,
      customer_tg_id: customerTgId,
      total_amount_usd: totalUsd,
      ...paymentDetails,
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  const orderItems = items.map(item => ({
    order_id: order.order_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_checkout: item.price_at_checkout,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
  if (itemsErr) throw itemsErr;

  // Decrement stock atomically
  for (const item of items) {
    try { await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity }); } catch {}
  }

  return order;
}

export async function getMerchantOrders(merchantId: number, limit = 50): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders').select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('order_id', orderId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('order_id', orderId);
  if (error) throw error;
}

export async function getMerchantBySlug(slug: string): Promise<any | null> {
  const { data, error } = await supabase.from('merchants').select('*').eq('store_slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}
