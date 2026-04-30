export function getStorefrontHTML(): string {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Vertext Store</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{--bg:#080810;--s1:#0f0f1c;--s2:#161628;--bd:#1e1e35;--gr:#00e676;--pu:#7c4dff;--re:#ff5252;--yw:#ffab40;--tx:#eeeeff;--mu:#6b6b8a}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--tx);min-height:100vh}
.topbar{background:var(--s1);border-bottom:1px solid var(--bd);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.store-title{font-size:17px;font-weight:700}.store-bio{font-size:11px;color:var(--mu);margin-top:2px}
.cart-btn{background:var(--s2);border:1px solid var(--bd);color:var(--tx);padding:8px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px}
.cart-count{background:var(--gr);color:#000;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.tabs{display:flex;background:var(--s1);border-bottom:1px solid var(--bd)}
.tab{flex:1;padding:11px;font-size:13px;font-weight:500;color:var(--mu);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
.tab.on{color:var(--gr);border-bottom-color:var(--gr)}
.page{padding:14px;max-width:600px;margin:0 auto}
/* Products grid */
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;overflow:hidden;cursor:pointer;transition:border-color .15s}
.prod-card:hover{border-color:var(--pu)}
.prod-img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:36px}
.prod-img img{width:100%;height:100%;object-fit:cover}
.prod-body{padding:12px}
.prod-name{font-size:13px;font-weight:600;margin-bottom:4px}
.prod-desc{font-size:11px;color:var(--mu);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prod-price{font-size:15px;font-weight:700;font-family:monospace;color:var(--gr)}
.prod-stock{font-size:10px;color:var(--mu);margin-top:2px}
.add-btn{width:100%;margin-top:8px;padding:9px;background:var(--pu);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.add-btn:active{opacity:.8}
/* Cart */
.cart-item{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center}
.cart-name{font-size:14px;font-weight:600}.cart-meta{font-size:12px;color:var(--mu);margin-top:2px;font-family:monospace}
.qty-ctrl{display:flex;align-items:center;gap:8px}
.qty-btn{width:28px;height:28px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:7px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.qty-num{font-family:monospace;font-weight:700;min-width:20px;text-align:center}
.checkout-bar{position:fixed;bottom:0;left:0;right:0;background:var(--s1);border-top:1px solid var(--bd);padding:14px 16px;display:none}
.checkout-bar.show{display:block}
.checkout-btn{width:100%;padding:15px;background:var(--gr);color:#000;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
.checkout-btn:disabled{opacity:.6;cursor:not-allowed}
/* Payment screen */
.pay-screen{padding:20px;text-align:center}
.pay-title{font-size:20px;font-weight:700;margin-bottom:6px}.pay-sub{color:var(--mu);font-size:13px;margin-bottom:24px}
.qr-wrap{background:#fff;border-radius:14px;padding:14px;display:inline-block;margin-bottom:20px}
.qr-wrap img{width:200px;height:200px;display:block}
.pay-addr{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:13px;font-family:monospace;font-size:12px;word-break:break-all;color:var(--pu);margin:12px 0;cursor:pointer}
.pay-amount{font-size:18px;font-weight:700;font-family:monospace;color:var(--gr);margin:8px 0}
.copy-hint{font-size:11px;color:var(--mu);margin-top:4px}
.spin{width:16px;height:16px;border:2.5px solid rgba(0,0,0,.2);border-top-color:rgba(0,0,0,.9);border-radius:50%;animation:rot .6s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.empty{text-align:center;color:var(--mu);padding:36px;font-size:14px}
.alert{padding:11px 14px;border-radius:9px;font-size:13px;margin:0 0 12px}
.alert-e{background:#180000;border:1px solid var(--re);color:#ff8080}
.alert-i{background:#001030;border:1px solid var(--pu);color:#a080ff}
.pb16{padding-bottom:80px}
</style>
</head>
<body>
<div class="topbar">
  <div><div class="store-title" id="storeTitle">Loading...</div><div class="store-bio" id="storeBio"></div></div>
  <button class="cart-btn" onclick="showTab('cart')">
    🛒 Cart <span class="cart-count" id="cartCount">0</span>
  </button>
</div>
<div class="tabs">
  <button class="tab on" onclick="showTab('shop',this)">Shop</button>
  <button class="tab" onclick="showTab('cart',this)">Cart</button>
</div>

<div class="page pb16" id="globalAlert"></div>

<!-- SHOP TAB -->
<div class="page pb16" id="pg-shop">
  <div id="prodGrid"><div class="empty">Loading products...</div></div>
</div>

<!-- CART TAB -->
<div class="page pb16" id="pg-cart" style="display:none">
  <div id="cartItems"><div class="empty">Your cart is empty.<br>Browse the shop to add items!</div></div>
</div>

<!-- PAYMENT SCREEN -->
<div id="pg-payment" style="display:none">
  <div class="pay-screen">
    <div class="pay-title">Payment Request</div>
    <div class="pay-sub" id="payOrderId"></div>
    <div class="qr-wrap"><img id="payQR" src="" alt="QR Code"></div>
    <div class="pay-amount" id="payAmount">—</div>
    <div class="pay-addr" id="payAddr" onclick="copyAddr()">Tap to copy address</div>
    <div class="copy-hint">Tap address to copy · Expires in 20 minutes</div>
    <button class="btn" style="margin-top:20px;padding:13px 24px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;width:100%" onclick="donePayment()">Done — Return to Chat</button>
  </div>
</div>

<!-- CHECKOUT BAR -->
<div class="checkout-bar" id="checkoutBar">
  <button class="checkout-btn" id="checkoutBtn" onclick="doCheckout()">
    Checkout · <span id="cartTotal">$0.00</span>
  </button>
</div>

<script>
const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();
tg.MainButton.hide();

const uid = tg.initDataUnsafe?.user?.id;
let merchantId = null;
let products = [];
let cart = {}; // { productId: qty }
let payData = null;

// Parse startapp param: store_<slug_or_id>
function getMerchantParam() {
  const sp = tg.initDataUnsafe?.start_param || new URLSearchParams(location.search).get('startapp') || '';
  if (sp.startsWith('store_')) return sp.slice(6);
  if (sp.startsWith('merchant_')) return sp.slice(9);
  return sp || new URLSearchParams(location.search).get('m') || '';
}

async function load() {
  const param = getMerchantParam();
  if (!param) {
    document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">No store specified. Open via a store link.</div>';
    return;
  }
  try {
    const res = await fetch('/api/store/' + encodeURIComponent(param));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Store not found');
    merchantId = data.merchant.telegram_id;
    products = data.products;
    document.getElementById('storeTitle').textContent = data.merchant.store_name || 'Store';
    document.getElementById('storeBio').textContent = data.merchant.store_bio || '';
    renderShop();
  } catch (e) {
    document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">' + e.message + '</div>';
    document.getElementById('storeTitle').textContent = 'Error';
  }
}

function renderShop() {
  const el = document.getElementById('prodGrid');
  if (!products.length) { el.innerHTML = '<div class="empty">No products available.</div>'; return; }
  el.innerHTML = '<div class="prod-grid">' + products.map(p =>
    '<div class="prod-card">' +
    '<div class="prod-img">' + (p.image_url ? '<img src="' + p.image_url + '" onerror="this.parentNode.textContent=\'📦\'">' : '📦') + '</div>' +
    '<div class="prod-body">' +
    '<div class="prod-name">' + p.name + '</div>' +
    (p.description ? '<div class="prod-desc">' + p.description + '</div>' : '') +
    '<div class="prod-price">$' + Number(p.price_usd).toFixed(2) + '</div>' +
    '<div class="prod-stock">' + (p.stock_count < 10 ? '⚠️ Only ' + p.stock_count + ' left' : p.stock_count + ' in stock') + '</div>' +
    '<button class="add-btn" onclick="addToCart(\'' + p.product_id + '\')">Add to Cart</button>' +
    '</div></div>'
  ).join('') + '</div>';
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  updateCartUI();
  tg.HapticFeedback?.impactOccurred('light');
  // Flash feedback
  const btn = event.target;
  btn.textContent = '✓ Added!';
  btn.style.background = 'var(--gr)';
  btn.style.color = '#000';
  setTimeout(() => { btn.textContent = 'Add to Cart'; btn.style.background = ''; btn.style.color = ''; }, 800);
}

function updateCartUI() {
  const total = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalUsd = Object.entries(cart).reduce((s, [id, q]) => {
    const p = products.find(x => x.product_id === id);
    return s + (p ? p.price_usd * q : 0);
  }, 0);
  document.getElementById('cartCount').textContent = total;
  document.getElementById('cartTotal').textContent = '$' + totalUsd.toFixed(2);
  document.getElementById('checkoutBar').className = 'checkout-bar' + (total > 0 ? ' show' : '');
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartItems');
  const entries = Object.entries(cart).filter(([, q]) => q > 0);
  if (!entries.length) { el.innerHTML = '<div class="empty">Your cart is empty.</div>'; return; }
  el.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.product_id === id);
    if (!p) return '';
    return '<div class="cart-item">' +
      '<div><div class="cart-name">' + p.name + '</div>' +
      '<div class="cart-meta">$' + p.price_usd.toFixed(2) + ' each</div></div>' +
      '<div class="qty-ctrl">' +
      '<button class="qty-btn" onclick="changeQty(\'' + id + '\',-1)">−</button>' +
      '<div class="qty-num">' + qty + '</div>' +
      '<button class="qty-btn" onclick="changeQty(\'' + id + '\',1)">+</button>' +
      '</div></div>';
  }).join('');
}

function changeQty(productId, delta) {
  cart[productId] = (cart[productId] || 0) + delta;
  if (cart[productId] <= 0) delete cart[productId];
  updateCartUI();
}

async function doCheckout() {
  if (!uid) { alert('Please open this store from your Telegram app.'); return; }
  const cartArr = Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>({product_id:id,quantity:qty}));
  if (!cartArr.length) return;

  const btn = document.getElementById('checkoutBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Processing...';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, customer_tg_id: uid, cart: cartArr }),
    });
    const data = await res.json();
    btn.disabled = false;
    btn.innerHTML = 'Checkout · <span id="cartTotal">$' + Object.entries(cart).reduce((s,[id,q])=>{const p=products.find(x=>x.product_id===id);return s+(p?p.price_usd*q:0);},0).toFixed(2) + '</span>';

    if (!res.ok) {
      document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">' + (data.error || 'Checkout failed') + '</div>';
      return;
    }

    payData = data;
    showPaymentScreen(data);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Checkout';
    document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">' + e.message + '</div>';
  }
}

function showPaymentScreen(data) {
  document.getElementById('pg-shop').style.display = 'none';
  document.getElementById('pg-cart').style.display = 'none';
  document.getElementById('checkoutBar').className = 'checkout-bar';
  document.querySelectorAll('.tabs').forEach(t => t.style.display = 'none');
  document.getElementById('pg-payment').style.display = 'block';
  document.getElementById('payOrderId').textContent = 'Order #' + data.order_id.slice(0,8).toUpperCase();
  document.getElementById('payAmount').textContent = data.pay_amount + ' ' + data.pay_currency.toUpperCase();
  document.getElementById('payAddr').textContent = data.pay_address;
  if (data.qr_base64) {
    document.getElementById('payQR').src = 'data:image/png;base64,' + data.qr_base64;
  }
  cart = {}; // Clear cart
  updateCartUI();
}

function copyAddr() {
  navigator.clipboard.writeText(payData?.pay_address || '').then(() => {
    const el = document.getElementById('payAddr');
    const orig = el.textContent;
    el.textContent = '✓ Copied!';
    el.style.color = 'var(--gr)';
    setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1500);
  });
}

function donePayment() {
  tg.close();
}

function showTab(name, btnEl) {
  document.getElementById('pg-shop').style.display = name === 'shop' ? 'block' : 'none';
  document.getElementById('pg-cart').style.display = name === 'cart' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  if (btnEl) btnEl.classList.add('on');
  else { const tabs=['shop','cart']; document.querySelectorAll('.tab')[tabs.indexOf(name)]?.classList.add('on'); }
}

load();
</script>
</body>
</html>`;
}
