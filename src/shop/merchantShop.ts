import { Telegraf, Markup } from 'telegraf';
import { supabase } from '../supabase';
import { getMerchant } from '../supabase';
import { createProduct, getMerchantProducts, updateProduct, getMerchantOrders } from './shopDb';
import { CONFIG } from '../config';

// Multi-step add_product wizard session
const addProductSession = new Map<number, {
  step: 'NAME' | 'DESCRIPTION' | 'PRICE' | 'STOCK' | 'PHOTO';
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
}>();

const ITEMS_PER_PAGE = 5;

export function registerMerchantShopHandlers(bot: Telegraf) {

  // ─── /add_product wizard ──────────────────────────────────────────────────
  bot.command('add_product', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register as a merchant first with /start');
    addProductSession.set(userId, { step: 'NAME' });
    await ctx.reply(
      '🛍️ *Add New Product — Step 1/5*\n\nWhat is the product name?',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
    );
  });

  // ─── /my_products ─────────────────────────────────────────────────────────
  bot.command('my_products', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await showProductsPage(ctx, userId, 0);
  });

  bot.action(/^products_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showProductsPage(ctx, ctx.from!.id, page, true);
  });

  // ─── /my_orders ───────────────────────────────────────────────────────────
  bot.command('my_orders', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await showOrdersPage(ctx, userId, 0);
  });

  bot.action(/^orders_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showOrdersPage(ctx, ctx.from!.id, page, true);
  });

  // ─── Mark order shipped ───────────────────────────────────────────────────
  bot.action(/^ship_order_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('Marking as shipped...');
    const orderId = ctx.match[1];
    const { error } = await supabase.from('orders').update({ status: 'SHIPPED' }).eq('order_id', orderId);
    if (error) return ctx.reply('Failed to update order.');
    await ctx.editMessageText('✅ Order marked as shipped!\n\nRef: `' + orderId.slice(0, 8) + '...`', { parse_mode: 'Markdown' });
    // Notify customer
    const { data: order } = await supabase.from('orders').select('customer_tg_id,total_amount_usd').eq('order_id', orderId).single();
    if (order?.customer_tg_id) {
      await bot.telegram.sendMessage(order.customer_tg_id,
        '📦 *Your order has been shipped!*\n\nOrder: `' + orderId.slice(0, 8) + '...`\nAmount: $' + Number(order.total_amount_usd).toFixed(2),
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  });

  // ─── Toggle product active/inactive ──────────────────────────────────────
  bot.action(/^toggle_product_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const productId = ctx.match[1];
    const userId = ctx.from!.id;
    const { data: prod } = await supabase.from('products').select('*').eq('product_id', productId).eq('merchant_id', userId).single();
    if (!prod) return ctx.reply('Product not found.');
    await updateProduct(productId, userId, { is_active: !prod.is_active });
    await ctx.editMessageText(
      `Product "${prod.name}" is now ${!prod.is_active ? '✅ Active' : '⛔ Inactive'}`,
      { ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back to Products', 'products_page_0')]]) }
    );
  });

  // ─── Store setup ──────────────────────────────────────────────────────────
  bot.command('setup_store', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const merchant = await getMerchant(userId).catch(() => null);
    if (!merchant?.payout_address) return ctx.reply('Register first.');
    const current = (merchant as any);
    await ctx.reply(
      '🏪 *Store Setup*\n\n' +
      'Current slug: `' + (current.store_slug ?? 'not set') + '`\n' +
      'Store name: ' + (current.store_name ?? 'not set') + '\n\n' +
      'Use:\n`/set_slug yourslug` — set your store URL\n`/set_storename My Store Name`\n`/set_storebio Short description`',
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('set_slug', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const slug = ctx.message.text.split(' ')[1]?.trim().toLowerCase();
    if (!slug || !/^[a-z0-9_]{3,30}$/.test(slug)) return ctx.reply('Slug must be 3-30 lowercase letters/numbers/underscores.\nExample: /set_slug myshop');
    try {
      await supabase.from('merchants').update({ store_slug: slug }).eq('telegram_id', userId);
      const storeUrl = `https://t.me/${CONFIG.BOT_USERNAME}/store?startapp=${slug}`;
      await ctx.reply(
        '✅ *Store slug set!*\n\nYour store link:\n`' + storeUrl + '`\n\nShare this link with customers!',
        { parse_mode: 'Markdown' }
      );
    } catch { await ctx.reply('That slug is already taken. Try another.'); }
  });

  bot.command('set_storename', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const name = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!name) return ctx.reply('Usage: /set_storename My Awesome Store');
    await supabase.from('merchants').update({ store_name: name.slice(0, 60) }).eq('telegram_id', userId);
    await ctx.reply('✅ Store name set: *' + name + '*', { parse_mode: 'Markdown' });
  });

  bot.command('set_storebio', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const bio = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!bio) return ctx.reply('Usage: /set_storebio Your store description');
    await supabase.from('merchants').update({ store_bio: bio.slice(0, 200) }).eq('telegram_id', userId);
    await ctx.reply('✅ Store bio set!');
  });

  bot.action('cancel_add_product', async (ctx) => {
    await ctx.answerCbQuery();
    addProductSession.delete(ctx.from!.id);
    await ctx.editMessageText('❌ Product creation cancelled.');
  });

  // ─── Text router for product wizard ──────────────────────────────────────
  return addProductSession;
}

// ─── Product wizard text handler (inject into bot.ts text router) ─────────────
export async function handleProductWizardText(
  bot: Telegraf,
  ctx: any,
  userId: number,
  text: string
): Promise<boolean> {
  const session = addProductSession.get(userId);
  if (!session) return false;

  if (session.step === 'NAME') {
    if (text.length < 2) { await ctx.reply('Name too short. Try again:'); return true; }
    addProductSession.set(userId, { ...session, step: 'DESCRIPTION', name: text.slice(0, 100) });
    await ctx.reply('✅ Name: *' + text + '*\n\n📝 *Step 2/5* — Enter a description (or type "skip"):',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
    );
    return true;
  }

  if (session.step === 'DESCRIPTION') {
    const desc = text.toLowerCase() === 'skip' ? '' : text.slice(0, 500);
    addProductSession.set(userId, { ...session, step: 'PRICE', description: desc });
    await ctx.reply('💵 *Step 3/5* — Enter the price in USD:\nExample: `29.99`',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
    );
    return true;
  }

  if (session.step === 'PRICE') {
    const price = parseFloat(text);
    if (isNaN(price) || price <= 0) { await ctx.reply('Invalid price. Enter a positive number like `9.99`', { parse_mode: 'Markdown' }); return true; }
    addProductSession.set(userId, { ...session, step: 'STOCK', price });
    await ctx.reply('📦 *Step 4/5* — How many units in stock?\nEnter a number or type "unlimited" for 999999:',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
    );
    return true;
  }

  if (session.step === 'STOCK') {
    const stock = text.toLowerCase() === 'unlimited' ? 999999 : parseInt(text);
    if (isNaN(stock) || stock < 0) { await ctx.reply('Enter a valid number or "unlimited"'); return true; }
    addProductSession.set(userId, { ...session, step: 'PHOTO', stock });
    await ctx.reply('🖼️ *Step 5/5* — Send a product photo (or type "skip"):',
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('Skip Photo', 'skip_product_photo'), Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
    );
    return true;
  }

  return false;
}

// Handle photo upload for product wizard
export function registerProductPhotoHandler(bot: Telegraf, addProductSess: Map<number, any>) {
  bot.action('skip_product_photo', async (ctx) => {
    await ctx.answerCbQuery();
    const session = addProductSess.get(ctx.from!.id);
    if (!session || session.step !== 'PHOTO') return;
    await saveProduct(bot, ctx, ctx.from!.id, session, null);
  });

  bot.on('photo', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const session = addProductSess.get(userId);
    if (!session || session.step !== 'PHOTO') return;
    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      await saveProduct(bot, ctx, userId, session, fileLink.href);
    } catch {
      await saveProduct(bot, ctx, userId, session, null);
    }
  });
}

async function saveProduct(bot: Telegraf, ctx: any, userId: number, session: any, imageUrl: string | null) {
  addProductSession.delete(userId);
  try {
    const product = await createProduct(userId, {
      name: session.name!,
      description: session.description ?? '',
      price_usd: session.price!,
      stock_count: session.stock!,
      image_url: imageUrl,
    });
    await ctx.reply(
      '🎉 *Product Created!*\n\n' +
      '📦 ' + product.name + '\n' +
      '💵 $' + Number(product.price_usd).toFixed(2) + '\n' +
      '📊 Stock: ' + product.stock_count + '\n' +
      '🆔 ID: `' + product.product_id.slice(0, 8) + '...`',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➕ Add Another', 'start_add_product'), Markup.button.callback('📋 My Products', 'products_page_0')],
        ]),
      }
    );
  } catch (err: any) {
    await ctx.reply('❌ Failed to save product: ' + err.message);
  }
}

async function showProductsPage(ctx: any, userId: number, page: number, edit = false) {
  const products = await getMerchantProducts(userId);
  const total = products.length;
  if (!total) {
    const msg = '📦 You have no products yet.\n\nUse /add_product to create your first product!';
    return edit ? ctx.editMessageText(msg) : ctx.reply(msg);
  }
  const start = page * ITEMS_PER_PAGE;
  const slice = products.slice(start, start + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const lines = slice.map((p: any, i: number) =>
    `${start + i + 1}. ${p.is_active ? '✅' : '⛔'} *${p.name}* — $${Number(p.price_usd).toFixed(2)} (${p.stock_count} in stock)`
  ).join('\n');

  const itemButtons = slice.map((p: any) => [
    Markup.button.callback((p.is_active ? '⛔ Deactivate' : '✅ Activate') + ' ' + p.name.slice(0, 20), 'toggle_product_' + p.product_id),
  ]);

  const navButtons = [];
  if (page > 0) navButtons.push(Markup.button.callback('⬅️ Prev', 'products_page_' + (page - 1)));
  if (page < totalPages - 1) navButtons.push(Markup.button.callback('Next ➡️', 'products_page_' + (page + 1)));
  if (navButtons.length) itemButtons.push(navButtons);
  itemButtons.push([Markup.button.callback('➕ Add Product', 'start_add_product')]);

  const text = `📦 *My Products* (${total} total | Page ${page + 1}/${totalPages})\n\n${lines}`;
  if (edit) return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(itemButtons) });
  return ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(itemButtons) });
}

async function showOrdersPage(ctx: any, userId: number, page: number, edit = false) {
  const orders = await getMerchantOrders(userId);
  const total = orders.length;
  if (!total) {
    const msg = '🛒 No orders yet. Share your store link to start selling!';
    return edit ? ctx.editMessageText(msg) : ctx.reply(msg);
  }
  const start = page * ITEMS_PER_PAGE;
  const slice = orders.slice(start, start + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const statusIcon: Record<string, string> = { PENDING: '⏳', PAID: '✅', SHIPPED: '📦', CANCELLED: '❌' };

  const text = `🛒 *My Orders* (${total} total | Page ${page + 1}/${totalPages})\n\n` +
    slice.map((o: any) =>
      `${statusIcon[o.status] ?? '❓'} \`${o.order_id.slice(0, 8)}\` — $${Number(o.total_amount_usd).toFixed(2)} — ${o.status}`
    ).join('\n');

  const itemButtons = slice
    .filter((o: any) => o.status === 'PAID')
    .map((o: any) => [Markup.button.callback('📦 Ship ' + o.order_id.slice(0, 8), 'ship_order_' + o.order_id)]);

  const navButtons = [];
  if (page > 0) navButtons.push(Markup.button.callback('⬅️ Prev', 'orders_page_' + (page - 1)));
  if (page < totalPages - 1) navButtons.push(Markup.button.callback('Next ➡️', 'orders_page_' + (page + 1)));
  if (navButtons.length) itemButtons.push(navButtons);

  if (edit) return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(itemButtons) });
  return ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(itemButtons) });
}

// Export for bot.ts action
export { addProductSession };
