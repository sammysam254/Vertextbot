export function getMerchantMiniAppHTML(): string {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Vertext Merchant</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{--bg:#0a0a14;--s1:#111122;--s2:#181830;--bd:#222240;--gr:#00e676;--pu:#7c4dff;--re:#ff5252;--yw:#ffab40;--tx:#eeeeff;--mu:#7070a0}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--tx);min-height:100vh;overflow-x:hidden}
.topbar{background:var(--s1);border-bottom:1px solid var(--bd);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.logo{font-family:monospace;font-size:16px;color:var(--gr);letter-spacing:-1px}.store-name{font-size:12px;color:var(--mu);margin-top:2px}
.tabs{display:flex;background:var(--s1);border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:11px 18px;font-size:13px;font-weight:500;color:var(--mu);background:none;border:none;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;font-family:inherit}
.tab.on{color:var(--gr);border-bottom-color:var(--gr)}
.page{padding:16px;max-width:600px;margin:0 auto}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:18px;margin-bottom:14px}
.card-label{font-size:10px;font-family:monospace;color:var(--mu);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
.big-num{font-size:36px;font-weight:700;font-family:monospace;color:var(--gr);line-height:1}
.sub{font-size:12px;color:var(--mu);margin-top:4px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.stat{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:13px;text-align:center}
.stat-v{font-size:20px;font-weight:700;font-family:monospace}.stat-l{font-size:10px;color:var(--mu);margin-top:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:11px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .15s}
.btn:disabled{opacity:.5;cursor:not-allowed}.btn-primary{background:var(--gr);color:#000}.btn-secondary{background:var(--s2);color:var(--tx);border:1px solid var(--bd)}.btn-danger{background:transparent;color:var(--re);border:1px solid var(--re)}.btn-sm{padding:7px 13px;font-size:12px;border-radius:8px}.btn-full{width:100%}
.spin{width:13px;height:13px;border:2px solid rgba(0,0,0,.2);border-top-color:rgba(0,0,0,.9);border-radius:50%;animation:rot .6s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.fld{margin-bottom:14px}.fld label{display:block;font-size:10px;color:var(--mu);font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.fld input,.fld textarea,.fld select{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:9px;padding:11px 14px;color:var(--tx);font-size:14px;font-family:inherit;outline:none}
.fld input:focus,.fld textarea:focus{border-color:var(--pu)}.fld textarea{min-height:70px;resize:vertical}
.alert{padding:11px 14px;border-radius:9px;font-size:13px;margin-bottom:12px}
.alert-e{background:#180000;border:1px solid var(--re);color:#ff8080}.alert-s{background:#002800;border:1px solid var(--gr);color:#80ff80}.alert-i{background:#001030;border:1px solid var(--pu);color:#a080ff}
.prod-item{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center}
.prod-name{font-size:14px;font-weight:600}.prod-meta{font-size:11px;color:var(--mu);margin-top:3px;font-family:monospace}
.badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:9px;font-weight:700;font-family:monospace}
.badge-on{background:#002800;color:var(--gr)}.badge-off{background:#180000;color:var(--re)}
.order-item{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:9px}
.row2{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.empty{text-align:center;color:var(--mu);padding:32px;font-size:14px}
.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.section-title{font-size:17px;font-weight:700}
</style>
</head>
<body>
<div class="topbar">
  <div><div class="logo">VERTEXT</div><div class="store-name" id="storeName">Merchant Panel</div></div>
  <div id="balBadge" style="font-family:monospace;font-size:14px;color:var(--gr)">$0.00</div>
</div>
<div class="tabs">
  <button class="tab on" onclick="showTab('overview',this)">Overview</button>
  <button class="tab" onclick="showTab('products',this)">Products</button>
  <button class="tab" onclick="showTab('addprod',this)">+ Add Product</button>
  <button class="tab" onclick="showTab('orders',this)">Orders</button>
  <button class="tab" onclick="showTab('wallet',this)">Wallet</button>
</div>

<div class="page">
  <div id="globalAlert"></div>

  <!-- OVERVIEW -->
  <div id="pg-overview">
    <div class="card"><div class="card-label">Available Balance</div><div class="big-num" id="ovBal">—</div><div class="sub" id="ovNet">USDT</div></div>
    <div class="grid3">
      <div class="stat"><div class="stat-v" id="ovOrders">—</div><div class="stat-l">Orders</div></div>
      <div class="stat"><div class="stat-v" style="color:var(--gr)" id="ovPaid">—</div><div class="stat-l">Paid</div></div>
      <div class="stat"><div class="stat-v" style="color:var(--yw)" id="ovProducts">—</div><div class="stat-l">Products</div></div>
    </div>
    <div class="card"><div class="card-label">Store Link</div><div id="storeLink" style="font-family:monospace;font-size:12px;color:var(--pu);word-break:break-all;margin-bottom:10px">—</div>
      <div class="row2"><button class="btn btn-secondary btn-sm" onclick="copyStoreLink()">Copy Link</button><button class="btn btn-primary btn-sm" onclick="showTab('addprod',null)">+ Add Product</button></div>
    </div>
  </div>

  <!-- PRODUCTS -->
  <div id="pg-products" style="display:none">
    <div class="section-head"><div class="section-title">Products</div><button class="btn btn-primary btn-sm" onclick="showTab('addprod',null)">+ Add</button></div>
    <div id="prodList"><div class="empty">Loading...</div></div>
  </div>

  <!-- ADD PRODUCT -->
  <div id="pg-addprod" style="display:none">
    <div class="section-title" style="margin-bottom:16px">New Product</div>
    <div id="addProdAlert"></div>
    <div class="fld"><label>Product Name *</label><input type="text" id="pName" placeholder="e.g. Smart LED Lamp" maxlength="100"></div>
    <div class="fld"><label>Description</label><textarea id="pDesc" placeholder="Brief product description..." maxlength="500"></textarea></div>
    <div class="fld"><label>Price (USD) *</label><input type="number" id="pPrice" placeholder="29.99" min="0.01" step="0.01"></div>
    <div class="fld"><label>Stock Count</label><input type="number" id="pStock" placeholder="100" min="0" step="1" value="0"></div>
    <div class="fld"><label>Image URL (optional)</label><input type="url" id="pImage" placeholder="https://..."></div>
    <button class="btn btn-primary btn-full" id="addProdBtn" onclick="doAddProduct()">Create Product</button>
  </div>

  <!-- ORDERS -->
  <div id="pg-orders" style="display:none">
    <div class="section-head"><div class="section-title">Orders</div><div id="ordStats" style="font-size:12px;color:var(--mu)"></div></div>
    <div id="orderList"><div class="empty">Loading...</div></div>
  </div>

  <!-- WALLET -->
  <div id="pg-wallet" style="display:none">
    <div class="section-title" style="margin-bottom:16px">Wallet</div>
    <div class="card"><div class="card-label">Balance</div><div class="big-num" id="wBal">—</div><div class="sub" id="wNet">USDT</div></div>
    <div id="wdAlert"></div>
    <div class="fld"><label>Withdraw Amount (USD)</label><input type="number" id="wAmt" placeholder="e.g. 50.00" min="0.01" step="0.01"></div>
    <button class="btn btn-primary btn-full" id="wdBtn" onclick="doWithdraw()">Request Withdrawal</button>
    <div style="font-size:11px;color:var(--mu);margin-top:8px">A confirmation will be sent to your Telegram chat.</div>
  </div>
</div>

<script>
const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();
const uid = tg.initDataUnsafe?.user?.id;
let M = null;
let storeLinkVal = '';

async function api(path, opts) {
  const r = await fetch('/api' + path + (path.includes('?')?'&':'?') + 'user_id=' + uid + '&api_key=tg_auth', opts || {});
  return r.json();
}

async function load() {
  if (!uid) { document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">Open via Telegram bot.</div>'; return; }
  const data = await api('/merchant/dashboard').catch(()=>null);
  if (!data || data.error) { document.getElementById('globalAlert').innerHTML = '<div class="alert alert-e">' + (data?.error || 'Failed to load') + '</div>'; return; }
  M = data;
  renderOverview();
  renderProducts();
  renderOrders();
}

function renderOverview() {
  const s = M.stats; const m = M.merchant;
  document.getElementById('ovBal').textContent = '$' + s.balance.toFixed(4);
  document.getElementById('ovNet').textContent = 'USDT on ' + m.payout_network;
  document.getElementById('balBadge').textContent = '$' + s.balance.toFixed(2);
  document.getElementById('wBal').textContent = '$' + s.balance.toFixed(4);
  document.getElementById('wNet').textContent = 'USDT on ' + m.payout_network;
  document.getElementById('ovOrders').textContent = s.total_orders;
  document.getElementById('ovPaid').textContent = s.paid_orders;
  document.getElementById('ovProducts').textContent = s.active_products;
  document.getElementById('storeName').textContent = m.store_name || 'My Store';
  const botUser = 'Vertextmarketbot';
  const slug = m.store_slug || m.telegram_id;
  storeLinkVal = window.location.origin + '/store?m=' + slug;
  document.getElementById('storeLink').textContent = storeLinkVal;
}

function renderProducts() {
  const el = document.getElementById('prodList');
  const prods = M.products || [];
  if (!prods.length) { el.innerHTML = '<div class="empty">No products yet. Add your first one!</div>'; return; }
  el.innerHTML = prods.map(p =>
    '<div class="prod-item">' +
    '<div><div class="prod-name">' + p.name + '</div>' +
    '<div class="prod-meta">$' + Number(p.price_usd).toFixed(2) + ' · ' + p.stock_count + ' in stock</div></div>' +
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
    '<span class="badge ' + (p.is_active ? 'badge-on' : 'badge-off') + '">' + (p.is_active ? 'ACTIVE' : 'OFF') + '</span>' +
    '<button class="btn btn-secondary btn-sm" onclick="toggleProd(\'' + p.product_id + '\',' + p.is_active + ')">' + (p.is_active ? 'Deactivate' : 'Activate') + '</button>' +
    '</div></div>'
  ).join('');
}

function renderOrders() {
  const el = document.getElementById('orderList');
  const orders = M.recent_orders || [];
  const s = M.stats;
  document.getElementById('ordStats').textContent = s.paid_orders + ' paid · ' + s.pending_orders + ' pending';
  if (!orders.length) { el.innerHTML = '<div class="empty">No orders yet.</div>'; return; }
  const icons = {PENDING:'⏳',PAID:'✅',SHIPPED:'📦',CANCELLED:'❌'};
  el.innerHTML = orders.map(o =>
    '<div class="order-item">' +
    '<div style="display:flex;justify-content:space-between">' +
    '<span style="font-family:monospace;font-size:12px">' + o.order_id.slice(0,8) + '...</span>' +
    '<span>' + (icons[o.status]||'?') + ' ' + o.status + '</span></div>' +
    '<div style="font-size:14px;font-weight:700;color:var(--gr);margin:4px 0">$' + Number(o.total_amount_usd).toFixed(2) + '</div>' +
    '<div style="font-size:11px;color:var(--mu)">' + new Date(o.created_at).toLocaleString() + '</div>' +
    (o.status === 'PAID' ? '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="shipOrder(\'' + o.order_id + '\')">Mark Shipped</button>' : '') +
    '</div>'
  ).join('');
}

async function toggleProd(id, isActive) {
  await fetch('/api/products/' + id + '?user_id=' + uid + '&api_key=tg_auth', {
    method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ is_active: !isActive })
  });
  await load();
  showTab('products', null);
}

async function doAddProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const desc = document.getElementById('pDesc').value.trim();
  const stock = parseInt(document.getElementById('pStock').value) || 0;
  const image = document.getElementById('pImage').value.trim();
  if (!name) { alert2('addProdAlert', 'Product name is required.', 'e'); return; }
  if (!price || price <= 0) { alert2('addProdAlert', 'Enter a valid price.', 'e'); return; }
  btnLoad('addProdBtn', true, 'Creating...');
  try {
    const res = await fetch('/api/products?user_id=' + uid + '&api_key=tg_auth', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, description: desc, price_usd: price, stock_count: stock, image_url: image || null })
    });
    const d = await res.json();
    btnLoad('addProdBtn', false, 'Create Product');
    if (!res.ok) { alert2('addProdAlert', d.error || 'Failed', 'e'); return; }
    alert2('addProdAlert', 'Product created!', 's');
    document.getElementById('pName').value = '';
    document.getElementById('pDesc').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pStock').value = '0';
    document.getElementById('pImage').value = '';
    await load();
  } catch(e) { btnLoad('addProdBtn', false, 'Create Product'); alert2('addProdAlert', e.message, 'e'); }
}

async function doWithdraw() {
  const amt = parseFloat(document.getElementById('wAmt').value);
  if (!amt || amt <= 0) { alert2('wdAlert', 'Enter a valid amount.', 'e'); return; }
  btnLoad('wdBtn', true, 'Processing...');
  try {
    const res = await fetch('/api/withdraw?user_id=' + uid + '&api_key=tg_auth', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ amount: amt })
    });
    const d = await res.json();
    btnLoad('wdBtn', false, 'Request Withdrawal');
    if (!res.ok) { alert2('wdAlert', d.error || 'Failed', 'e'); return; }
    alert2('wdAlert', 'Check your Telegram to confirm the withdrawal.', 's');
  } catch(e) { btnLoad('wdBtn', false, 'Request Withdrawal'); alert2('wdAlert', e.message, 'e'); }
}

async function shipOrder(id) {
  await fetch('/api/orders/' + id + '/ship?user_id=' + uid + '&api_key=tg_auth', { method: 'PUT' });
  gAlert('Order marked as shipped!', 's');
  await load();
  renderOrders();
}

function copyStoreLink() { navigator.clipboard.writeText(storeLinkVal).then(()=>gAlert('Store link copied!','s')); }

function showTab(name, btnEl) {
  document.querySelectorAll('[id^="pg-"]').forEach(p => p.style.display = 'none');
  document.getElementById('pg-' + name).style.display = 'block';
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  if (btnEl) btnEl.classList.add('on');
  else { const tabs=['overview','products','addprod','orders','wallet']; document.querySelectorAll('.tab')[tabs.indexOf(name)]?.classList.add('on'); }
}

function btnLoad(id, on, lbl) {
  const b = document.getElementById(id); if (!b) return;
  b.disabled = on;
  if (on) { b._o = b.innerHTML; b.innerHTML = '<span class="spin"></span>' + lbl; }
  else { b.innerHTML = b._o || lbl; }
}

function alert2(id, msg, type) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = msg ? '<div class="alert alert-' + type + '">' + msg + '</div>' : '';
}

function gAlert(msg, type) {
  alert2('globalAlert', msg, type);
  setTimeout(() => alert2('globalAlert', '', ''), 4000);
}

load();
</script>
</body>
</html>`;
}
