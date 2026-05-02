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
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--tx);min-height:100vh}
.topbar{background:var(--s1);border-bottom:1px solid var(--bd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.store-title{font-size:16px;font-weight:700}.store-bio{font-size:11px;color:var(--mu);margin-top:2px}
.cart-btn{background:var(--pu);color:#fff;padding:7px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;display:flex;align-items:center;gap:6px}
.cart-count{background:#fff;color:var(--pu);border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.tabs{display:flex;background:var(--s1);border-bottom:1px solid var(--bd)}
.tab{flex:1;padding:11px;font-size:13px;font-weight:500;color:var(--mu);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
.tab.on{color:var(--gr);border-bottom-color:var(--gr)}
.page{padding:14px;padding-bottom:100px}
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.prod-img{width:100%;aspect-ratio:1;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:40px;overflow:hidden}
.prod-img img{width:100%;height:100%;object-fit:cover}
.prod-body{padding:12px}
.prod-name{font-size:13px;font-weight:600;margin-bottom:4px}
.prod-desc{font-size:11px;color:var(--mu);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prod-price{font-size:15px;font-weight:700;font-family:monospace;color:var(--gr)}
.prod-stock{font-size:10px;color:var(--mu);margin-top:2px}
.add-btn{width:100%;margin-top:8px;padding:9px;background:var(--pu);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.add-btn.added{background:var(--gr);color:#000}
.cart-item{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center}
.cart-name{font-size:14px;font-weight:600}.cart-sub{font-size:11px;color:var(--mu);margin-top:2px;font-family:monospace}
.qty-row{display:flex;align-items:center;gap:8px}
.qty-btn{width:28px;height:28px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:7px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.qty-num{font-family:monospace;font-weight:700;min-width:20px;text-align:center}
.bar{position:fixed;bottom:0;left:0;right:0;background:var(--s1);border-top:1px solid var(--bd);padding:12px 16px;display:none}
.bar.show{display:block}
.checkout-btn{width:100%;padding:15px;background:var(--gr);color:#000;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
.checkout-btn:disabled{opacity:.6;cursor:not-allowed}
.pay-wrap{padding:20px;text-align:center}
.pay-h{font-size:20px;font-weight:700;margin-bottom:4px}
.pay-sub{color:var(--mu);font-size:13px;margin-bottom:20px}
.qr-box{background:#fff;border-radius:12px;padding:12px;display:inline-block;margin-bottom:14px}
.qr-box img{width:190px;height:190px;display:block}
.pay-amt{font-size:18px;font-weight:700;font-family:monospace;color:var(--gr);margin:8px 0}
.pay-addr{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:12px;font-family:monospace;font-size:11px;word-break:break-all;color:var(--pu);margin:10px 0;cursor:pointer;text-align:left}
.done-btn{width:100%;margin-top:16px;padding:14px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
.spin{width:15px;height:15px;border:2.5px solid rgba(0,0,0,.2);border-top-color:rgba(0,0,0,.9);border-radius:50%;animation:rot .6s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.empty{text-align:center;color:var(--mu);padding:40px 20px;font-size:14px;line-height:1.6}
.err{color:#ff8080}
.total-row{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:14px;display:flex;justify-content:space-between;font-weight:700;margin-top:12px}
</style>
</head>
<body>
<div class="topbar">
  <div><div class="store-title" id="sTitle">Vertext Store</div><div class="store-bio" id="sBio"></div></div>
  <button class="cart-btn" onclick="goTab('cart')">Cart <span class="cart-count" id="cCount">0</span></button>
</div>
<div class="tabs">
  <button class="tab on" onclick="goTab('shop',this)">Shop</button>
  <button class="tab" onclick="goTab('cart',this)">My Cart</button>
</div>
<div id="pg-shop" class="page"><div id="prodGrid" class="empty">Loading products...</div></div>
<div id="pg-cart" class="page" style="display:none"><div id="cartEl"><div class="empty">Cart is empty. Browse the shop!</div></div></div>
<div id="pg-pay" style="display:none">
  <div class="pay-wrap">
    <div class="pay-h">Payment Request</div>
    <div class="pay-sub" id="payOrd"></div>
    <div class="qr-box"><img id="payQR" src="" alt="QR"></div>
    <div class="pay-amt" id="payAmt"></div>
    <div class="pay-addr" id="payAddr" onclick="copyAddr()">Loading...</div>
    <div style="font-size:11px;color:var(--mu)">Tap address to copy · 20 min expiry</div>
    <button class="done-btn" onclick="window.Telegram.WebApp.close()">Done — Return to Chat</button>
  </div>
</div>
<div class="bar" id="checkBar">
  <button class="checkout-btn" id="checkBtn" onclick="doCheckout()">Checkout · <span id="cTotal">$0.00</span></button>
</div>
<script>
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const uid = tg?.initDataUnsafe?.user?.id || null;
let mid = null, prods = [], cart = {}, payData = null;

function getParam() {
  let p = '';
  try { p = tg?.initDataUnsafe?.start_param || ''; } catch(e){}
  if (!p) { const u = new URLSearchParams(location.search); p = u.get('m')||u.get('startapp')||u.get('store')||u.get('merchant')||''; }
  if (p.startsWith('store_')) p = p.slice(6);
  if (p.startsWith('merchant_')) p = p.slice(9);
  return p;
}

window.onload = async function() {
  const param = getParam();
  if (!param) { await loadMarketplace(); return; }
  try {
    const r = await fetch('/api/store/' + encodeURIComponent(param));
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Store not found');
    mid = d.merchant.telegram_id;
    prods = d.products || [];
    document.getElementById('sTitle').textContent = d.merchant.store_name || 'Store';
    document.getElementById('sBio').textContent = d.merchant.store_bio || prods.length + ' products';
    renderProds();
  } catch(e) {
    document.getElementById('sTitle').textContent = 'Error';
    document.getElementById('prodGrid').innerHTML = '<div class="empty err">' + e.message + '</div>';
  }
};

async function loadMarketplace() {
  document.getElementById('sTitle').textContent = 'Vertext Marketplace';
  document.getElementById('sBio').textContent = 'Browse all stores';
  try {
    const r = await fetch('/api/stores');
    const d = await r.json();
    const stores = d.stores || [];
    if (!stores.length) { document.getElementById('prodGrid').innerHTML = '<div class="empty">No stores yet.</div>'; return; }
    document.getElementById('prodGrid').innerHTML = '<div class="prod-grid">' + stores.map(s =>
      '<div class="prod-card" onclick="location.href=\'/store?m='+s.telegram_id+'\'">' +
      '<div class="prod-img">🏪</div><div class="prod-body">' +
      '<div class="prod-name">'+(s.store_name||'Store #'+s.telegram_id)+'</div>' +
      '<div class="prod-desc">'+(s.store_bio||'Tap to browse')+'</div>' +
      '<div class="prod-price">'+(s.product_count||0)+' products</div>' +
      '<button class="add-btn" onclick="event.stopPropagation();location.href=\'/store?m='+s.telegram_id+'\'">Visit Store</button>' +
      '</div></div>'
    ).join('') + '</div>';
  } catch(e) { document.getElementById('prodGrid').innerHTML = '<div class="empty err">'+e.message+'</div>'; }
}

function renderProds() {
  if (!prods.length) { document.getElementById('prodGrid').innerHTML = '<div class="empty">No products available.</div>'; return; }
  document.getElementById('prodGrid').innerHTML = '<div class="prod-grid">' + prods.map(p =>
    '<div class="prod-card">' +
    '<div class="prod-img">'+(p.image_url?'<img src="'+p.image_url+'" onerror="this.parentNode.textContent=\'📦\'">':'📦')+'</div>' +
    '<div class="prod-body">' +
    '<div class="prod-name">'+esc(p.name)+'</div>' +
    (p.description?'<div class="prod-desc">'+esc(p.description)+'</div>':'') +
    '<div class="prod-price">$'+Number(p.price_usd).toFixed(2)+'</div>' +
    '<div class="prod-stock">'+(p.stock_count<10?'⚠️ Only '+p.stock_count+' left':p.stock_count+' in stock')+'</div>' +
    '<button class="add-btn" id="ab-'+p.product_id+'" onclick="addCart(\''+p.product_id+'\',this)">Add to Cart</button>' +
    '</div></div>'
  ).join('') + '</div>';
}

function addCart(id, btn) {
  cart[id] = (cart[id]||0) + 1;
  updCart();
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  btn.textContent = '✓ Added!'; btn.classList.add('added');
  setTimeout(()=>{ btn.textContent='Add to Cart'; btn.classList.remove('added'); }, 800);
}

function updCart() {
  const tot = Object.values(cart).reduce((s,q)=>s+q,0);
  const usd = Object.entries(cart).reduce((s,[id,q])=>{ const p=prods.find(x=>x.product_id===id); return s+(p?p.price_usd*q:0); },0);
  document.getElementById('cCount').textContent = tot;
  document.getElementById('cTotal').textContent = '$'+usd.toFixed(2);
  document.getElementById('checkBar').className = 'bar'+(tot>0?' show':'');
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartEl');
  const entries = Object.entries(cart).filter(([,q])=>q>0);
  if (!entries.length) { el.innerHTML = '<div class="empty">Cart is empty.</div>'; return; }
  const usd = entries.reduce((s,[id,q])=>{ const p=prods.find(x=>x.product_id===id); return s+(p?p.price_usd*q:0); },0);
  el.innerHTML = entries.map(([id,qty])=>{
    const p = prods.find(x=>x.product_id===id); if(!p) return '';
    return '<div class="cart-item"><div><div class="cart-name">'+esc(p.name)+'</div><div class="cart-sub">$'+p.price_usd.toFixed(2)+' each</div></div>' +
    '<div class="qty-row"><button class="qty-btn" onclick="chgQty(\''+id+'\',-1)">−</button><span class="qty-num">'+qty+'</span><button class="qty-btn" onclick="chgQty(\''+id+'\',1)">+</button></div></div>';
  }).join('') + '<div class="total-row"><span>Total</span><span style="color:var(--gr);font-family:monospace">$'+usd.toFixed(2)+' USD</span></div>';
}

function chgQty(id, d) { cart[id]=(cart[id]||0)+d; if(cart[id]<=0) delete cart[id]; updCart(); }

async function doCheckout() {
  const entries = Object.entries(cart).filter(([,q])=>q>0);
  if (!entries.length) return;
  let custId = uid;
  if (!custId) {
    const input = prompt('Enter your Telegram ID to receive payment confirmation:\n(Get it from @userinfobot)');
    if (!input || isNaN(parseInt(input))) { alert('Invalid Telegram ID'); return; }
    custId = parseInt(input);
    localStorage.setItem('vxt_tgid', String(custId));
  }
  const btn = document.getElementById('checkBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Processing...';
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ merchant_id: mid, customer_tg_id: custId, cart: entries.map(([id,qty])=>({product_id:id,quantity:qty})) })
    });
    const txt = await res.text();
    let d;
    try { d = JSON.parse(txt); } catch(e) { throw new Error('Server error: ' + txt.slice(0,100)); }
    if (!res.ok) throw new Error(d.error || 'Checkout failed (HTTP '+res.status+')');
    
    payData = d;
    cart = {};
    updCart();

    // Hide shop screens
    const pgShop = document.getElementById('pg-shop');
    const pgCart = document.getElementById('pg-cart');
    const tabsEl = document.querySelector('.tabs');
    const barEl = document.getElementById('checkBar');
    const pgPay = document.getElementById('pg-pay');
    
    if (pgShop) pgShop.style.display = 'none';
    if (pgCart) pgCart.style.display = 'none';
    if (tabsEl) tabsEl.style.display = 'none';
    if (barEl) barEl.className = 'bar';
    // Build payment screen dynamically
    const qrImg = d.qr_base64 ? '<img id="payQR" src="data:image/png;base64,'+d.qr_base64+'" style="width:190px;height:190px;display:block">' : '';
    const payHtml = '<div class="pay-wrap">' +
      '<div class="pay-h">Payment Request</div>' +
      '<div class="pay-sub">Order #'+(d.order_id||'').slice(0,8).toUpperCase()+'</div>' +
      (d.qr_base64 ? '<div class="qr-box">'+qrImg+'</div>' : '') +
      '<div class="pay-amt">'+(d.pay_amount||'?')+' '+(d.pay_currency||'USDT').toUpperCase()+'</div>' +
      '<div class="pay-addr" onclick="copyAddr()" id="payAddrEl">'+(d.pay_address||'')+'</div>' +
      '<div style="font-size:11px;color:var(--mu);margin-bottom:16px">Tap address to copy · 20 min expiry</div>' +
      '<button class="done-btn" onclick="window.Telegram&&window.Telegram.WebApp?window.Telegram.WebApp.close():history.back()">Done — Return to Chat</button>' +
      '</div>';
    if (pgPay) { pgPay.innerHTML = payHtml; pgPay.style.display = 'block'; }

  } catch(e) {
    btn.disabled = false;
    btn.innerHTML = 'Checkout · <span id="cTotal">$0.00</span>';
    updCart();
    alert('Checkout error: ' + e.message);
  }
}

function copyAddr() {
  navigator.clipboard.writeText(payData?.pay_address || document.getElementById('payAddrEl')?.textContent || '').then(()=>{
    const el=document.getElementById('payAddr'); const o=el.textContent;
    el.textContent='✓ Copied!'; el.style.color='var(--gr)';
    setTimeout(()=>{ el.textContent=o; el.style.color=''; },1500);
  });
}

function goTab(name, btn) {
  ['shop','cart'].forEach(t=>{ document.getElementById('pg-'+t).style.display=t===name?'block':'none'; });
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  else { const tabs=['shop','cart']; document.querySelectorAll('.tab')[tabs.indexOf(name)]?.classList.add('on'); }
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
</script>
</body>
</html>`;
}
