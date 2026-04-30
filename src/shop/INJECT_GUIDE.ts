// ============================================================
// INJECT THIS INTO src/server.ts
// Add these imports at the TOP of server.ts:
// ============================================================

import shopRoutes from './shop/shopRoutes';
import { getMerchantMiniAppHTML } from './shop/merchantMiniApp';
import { getStorefrontHTML } from './shop/storefrontMiniApp';

// ============================================================
// Add these routes INSIDE createServer(), before the
// NOWPayments webhook route:
// ============================================================

// Shop API routes
app.use('/api', shopRoutes);

// Merchant Mini App
app.get('/merchant-app', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getMerchantMiniAppHTML());
});

// Customer Storefront Mini App
app.get('/store', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getStorefrontHTML());
});

// ============================================================
// INJECT THIS INTO src/bot.ts
// Add these imports:
// ============================================================

import {
  registerMerchantShopHandlers,
  registerProductPhotoHandler,
  addProductSession,
  handleProductWizardText,
} from './shop/merchantShop';
import { registerCustomerShopHandlers, openStore } from './shop/customerShop';

// ============================================================
// Add these inside createBot(), after registerApiKeyHandlers:
// ============================================================

// Shop handlers
const _addProductSess = registerMerchantShopHandlers(bot);
registerProductPhotoHandler(bot, _addProductSess);
registerCustomerShopHandlers(bot);

// ============================================================
// Add these action handlers (for menu keyboard buttons):
// ============================================================

bot.action('start_add_product', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;
  if (!userId) return;
  addProductSession.set(userId, { step: 'NAME' });
  await ctx.reply(
    '🛍️ *Add New Product — Step 1/5*\n\nWhat is the product name?',
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_add_product')]]) }
  );
});

bot.action('products_page_0', async (ctx) => {
  await ctx.answerCbQuery();
  // Delegates to merchantShop handler
});

// ============================================================
// Add to the bot.on('text') handler, BEFORE return next():
// ============================================================

// Product wizard text handler
const handledByWizard = await handleProductWizardText(bot, ctx, userId, text);
if (handledByWizard) return;

// ============================================================
// Add /start deep-link handler for store_<slug>:
// Modify the existing bot.start handler to include:
// ============================================================

// In bot.start:
if (payload?.startsWith('store_')) {
  return openStore(ctx, payload.slice(6));
}

// ============================================================
// UPDATE menu.ts - add shop buttons to MERCHANT_KB:
// Replace MERCHANT_KB with:
// ============================================================

const MERCHANT_KB = Markup.keyboard([
  ['My Wallet', 'Create Invoice'],
  ['My Invoices', 'My Orders'],
  ['My Products', 'My Store Orders'],
  ['Export CSV', 'Dashboard'],
  ['API Settings', 'Help'],
]).resize();

// And add these hears handlers in registerMenuHandlers:

bot.hears('My Products', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  // Trigger products page
  ctx.message = { ...ctx.message, text: '/my_products' } as any;
  await (ctx as any).reply('/my_products');
  // Or directly:
  const { getMerchantProducts } = await import('./shop/shopDb');
  const prods = await getMerchantProducts(userId);
  if (!prods.length) return ctx.reply('No products yet.\n\nUse /add_product to create your first product.');
  const buttons = prods.slice(0,8).map((p: any) => [Markup.button.callback((p.is_active?'✅':'⛔') + ' ' + p.name.slice(0,25) + ' $' + Number(p.price_usd).toFixed(2), 'toggle_product_' + p.product_id)]);
  buttons.push([Markup.button.callback('➕ Add Product', 'start_add_product')]);
  await ctx.reply('📦 *My Products* (' + prods.length + ')', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

bot.hears('My Store Orders', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const { getMerchantOrders } = await import('./shop/shopDb');
  const orders = await getMerchantOrders(userId, 10);
  if (!orders.length) return ctx.reply('No orders yet.');
  const icons: Record<string, string> = { PENDING:'⏳', PAID:'✅', SHIPPED:'📦', CANCELLED:'❌' };
  const text = '🛒 *Store Orders*\n\n' + orders.map((o: any) =>
    `${icons[o.status]||'?'} \`${o.order_id.slice(0,8)}\` $${Number(o.total_amount_usd).toFixed(2)} ${o.status}`
  ).join('\n');
  const shipButtons = orders.filter((o:any)=>o.status==='PAID').map((o:any)=>[Markup.button.callback('📦 Ship '+o.order_id.slice(0,8), 'ship_order_'+o.order_id)]);
  await ctx.reply(text, { parse_mode:'Markdown', ...Markup.inlineKeyboard(shipButtons) });
});

// Open Merchant Mini App button (add to start menu)
// Add to sendMainMenu in menu.ts for registered merchants:
// [Markup.button.webApp('🏪 Merchant Dashboard', CONFIG.WEBHOOK_DOMAIN + '/merchant-app')]
