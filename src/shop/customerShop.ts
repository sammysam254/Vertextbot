import { Telegraf, Markup } from 'telegraf';
import { getStoreProducts, getMerchantBySlug } from './shopDb';
import { supabase } from '../supabase';
import { CONFIG } from '../config';
import axios from 'axios';
import QRCode from 'qrcode';

// In-memory cart: Map<userId, { merchantId, items: { productId, qty, price, name }[] }>
const carts = new Map<number, { merchantId: number; items: { id: string; qty: number; price: number; name: string }[] }>();

const PAGE_SIZE = 5;

export function registerCustomerShopHandlers(bot: Telegraf) {

  // ─── /store <merchant_id or slug> ────────────────────────────────────────
  bot.command('store', async (ctx) => {
    const arg = ctx.message.text.split(' ')[1]?.trim();
    if (!arg) return ctx.reply('Usage: /store <merchant_id or slug>\nExample: /store myshop');
    await openStore(ctx, arg);
  });

  // ─── Paginate store products ──────────────────────────────────────────────
  bot.action(/^store_page_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    const merchantId = parseInt(ctx.match[2]);
    await showStorePage(ctx, merchantId, page, true);
  });

  // ─── Add to cart ──────────────────────────────────────────────────────────
  bot.action(/^addcart_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Added to cart!');
    const productId = ctx.match[1];
    const merchantId = parseInt(ctx.match[2]);
    const userId = ctx.from!.id;

    const { data: product } = await supabase.from('products').select('*').eq('product_id', productId).single();
    if (!product) return ctx.reply('Product not found.');

    const cart = carts.get(userId) ?? { merchantId, items: [] };
    if (cart.merchantId !== merchantId) {
      // Different merchant — clear cart
      carts.set(userId, { merchantId, items: [{ id: productId, qty: 1, price: Number(product.price_usd), name: product.name }] });
    } else {
      const existing = cart.items.find(i => i.id === productId);
      if (existing) existing.qty += 1;
      else cart.items.push({ id: productId, qty: 1, price: Number(product.price_usd), name: product.name });
      carts.set(userId, cart);
    }

    await ctx.reply(
      '🛒 *' + product.name + '* added to cart!\n\nCart: ' + cart.items.reduce((s, i) => s + i.qty, 0) + ' item(s)',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🛒 View Cart', 'view_cart_' + merchantId), Markup.button.callback('🛍️ Continue Shopping', 'store_page_0_' + merchantId)],
        ]),
      }
    );
  });

  // ─── View cart ────────────────────────────────────────────────────────────
  bot.action(/^view_cart_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const merchantId = parseInt(ctx.match[1]);
    await showCart(ctx, ctx.from!.id, merchantId);
  });

  bot.command('cart', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const cart = carts.get(userId);
    if (!cart) return ctx.reply('Your cart is empty. Use /store <merchant_id> to browse.');
    await showCart(ctx, userId, cart.merchantId);
  });

  // ─── Clear cart ───────────────────────────────────────────────────────────
  bot.action(/^clear_cart_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Cart cleared');
    carts.delete(ctx.from!.id);
    await ctx.editMessageText('🛒 Cart cleared.');
  });

  // ─── Remove item from cart ────────────────────────────────────────────────
  bot.action(/^removecart_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const merchantId = parseInt(ctx.match[2]);
    const userId = ctx.from!.id;
    const cart = carts.get(userId);
    if (cart) {
      cart.items = cart.items.filter(i => i.id !== productId);
      if (cart.items.length === 0) carts.delete(userId);
      else carts.set(userId, cart);
    }
    await showCart(ctx, userId, merchantId, true);
  });

  // ─── Checkout ─────────────────────────────────────────────────────────────
  bot.action(/^checkout_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Processing checkout...');
    const merchantId = parseInt(ctx.match[1]);
    const userId = ctx.from!.id;
    const cart = carts.get(userId);
    if (!cart || !cart.items.length) return ctx.reply('Your cart is empty.');

    await ctx.editMessageText('⏳ Creating payment...');

    try {
      const res = await axios.post(`${CONFIG.WEBHOOK_DOMAIN}/api/checkout`, {
        merchant_id: merchantId,
        customer_tg_id: userId,
        cart: cart.items.map(i => ({ product_id: i.id, quantity: i.qty })),
        pay_currency: 'usdttrc20',
      });
      const data = res.data;

      // Clear cart after checkout
      carts.delete(userId);

      // Generate QR buffer
      let qrBuffer: Buffer | null = null;
      if (data.qr_base64) qrBuffer = Buffer.from(data.qr_base64, 'base64');

      const caption =
        `🧾 *Order Created!*\n\n` +
        `Order: \`${data.order_id.slice(0, 8)}...\`\n` +
        `Total: *$${data.total_usd.toFixed(2)} USD*\n\n` +
        `🪙 *Pay Exactly:*\n\`${data.pay_amount} ${data.pay_currency.toUpperCase()}\`\n\n` +
        `📬 *Send to:*\n\`${data.pay_address}\`\n\n` +
        `⏱ Expires in 20 minutes`;

      if (qrBuffer) {
        await ctx.replyWithPhoto(
          { source: qrBuffer, filename: 'payment.png' },
          {
            caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('📡 Track Payment', 'check_status_' + data.invoice_id)]]),
          }
        );
      } else {
        await ctx.reply(caption, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('📡 Track Payment', 'check_status_' + data.invoice_id)]]),
        });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error ?? err.message ?? 'Checkout failed';
      await ctx.reply('❌ ' + errMsg);
    }
  });

  // ─── /my_orders (customer view) ───────────────────────────────────────────
  bot.command('my_orders_customer', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const { data: orders } = await supabase
      .from('orders').select('*')
      .eq('customer_tg_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (!orders?.length) return ctx.reply('You have no orders yet.');
    const statusIcon: Record<string, string> = { PENDING: '⏳', PAID: '✅', SHIPPED: '📦', CANCELLED: '❌' };
    const text = '🛒 *Your Orders*\n\n' + orders.map((o: any) =>
      `${statusIcon[o.status] ?? '❓'} \`${o.order_id.slice(0, 8)}\` — $${Number(o.total_amount_usd).toFixed(2)} — ${o.status}`
    ).join('\n');
    await ctx.reply(text, { parse_mode: 'Markdown' });
  });
}

// ─── Open store ───────────────────────────────────────────────────────────────
export async function openStore(ctx: any, arg: string) {
  let merchantId: number;

  const asInt = parseInt(arg, 10);
  if (!isNaN(asInt)) {
    merchantId = asInt;
  } else {
    // Slug lookup
    const merchant = await getMerchantBySlug(arg).catch(() => null);
    if (!merchant) return ctx.reply('❌ Store not found. Check the link and try again.');
    merchantId = merchant.telegram_id;
  }

  await showStorePage(ctx, merchantId, 0);
}

async function showStorePage(ctx: any, merchantId: number, page: number, edit = false) {
  const { data: merchant } = await supabase.from('merchants').select('store_name,store_bio,telegram_id').eq('telegram_id', merchantId).single();
  const products = await getStoreProducts(merchantId).catch(() => []);

  if (!products.length) {
    const msg = `🏪 *${merchant?.store_name ?? 'Store #' + merchantId}*\n\n${merchant?.store_bio ?? ''}\n\nNo products available right now.`;
    return edit ? ctx.editMessageText(msg, { parse_mode: 'Markdown' }) : ctx.reply(msg, { parse_mode: 'Markdown' });
  }

  const total = products.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const slice = products.slice(start, start + PAGE_SIZE);

  const header = `🏪 *${merchant?.store_name ?? 'Store #' + merchantId}*\n` +
    (merchant?.store_bio ? merchant.store_bio + '\n' : '') +
    `\nPage ${page + 1}/${totalPages} · ${total} products\n\n`;

  const lines = slice.map((p: any) =>
    `📦 *${p.name}* — $${Number(p.price_usd).toFixed(2)}\n${p.description ? '_' + p.description.slice(0, 60) + '_' : ''}`
  ).join('\n\n');

  const productButtons = slice.map((p: any) => [
    Markup.button.callback('🛒 Add: ' + p.name.slice(0, 25) + ' ($' + Number(p.price_usd).toFixed(2) + ')', 'addcart_' + p.product_id + '_' + merchantId),
  ]);

  const navBtns: any[] = [];
  if (page > 0) navBtns.push(Markup.button.callback('⬅️', 'store_page_' + (page - 1) + '_' + merchantId));
  navBtns.push(Markup.button.callback('🛒 Cart', 'view_cart_' + merchantId));
  if (page < totalPages - 1) navBtns.push(Markup.button.callback('➡️', 'store_page_' + (page + 1) + '_' + merchantId));
  if (navBtns.length) productButtons.push(navBtns);

  const text = header + lines;
  const opts = { parse_mode: 'Markdown' as const, ...Markup.inlineKeyboard(productButtons) };
  return edit ? ctx.editMessageText(text, opts) : ctx.reply(text, opts);
}

async function showCart(ctx: any, userId: number, merchantId: number, edit = false) {
  const cart = carts.get(userId);
  if (!cart || !cart.items.length) {
    const msg = '🛒 Your cart is empty.\n\nBrowse products to add items!';
    return edit ? ctx.editMessageText(msg) : ctx.reply(msg);
  }
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const lines = cart.items.map(i => `• ${i.name} × ${i.qty} = $${(i.price * i.qty).toFixed(2)}`).join('\n');
  const text = `🛒 *Your Cart*\n\n${lines}\n\n💵 *Total: $${total.toFixed(2)} USD*`;
  const removeButtons = cart.items.map(i => [Markup.button.callback('❌ Remove ' + i.name.slice(0, 20), 'removecart_' + i.id + '_' + merchantId)]);
  removeButtons.push([
    Markup.button.callback('💳 Checkout', 'checkout_' + merchantId),
    Markup.button.callback('🗑️ Clear Cart', 'clear_cart_' + merchantId),
  ]);
  const opts = { parse_mode: 'Markdown' as const, ...Markup.inlineKeyboard(removeButtons) };
  return edit ? ctx.editMessageText(text, opts) : ctx.reply(text, opts);
}
