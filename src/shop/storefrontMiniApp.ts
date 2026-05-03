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
.store-title{font-size:16px;font-weight:700}
.store-bio{font-size:11px;color:var(--mu);margin-top:2px}
.cart-btn{background:var(--pu);color:#fff;padding:7px 14px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit}
.tabs{display:flex;background:var(--s1);border-bottom:1px solid var(--bd)}
.tab{flex:1;padding:11px;font-size:13px;font-weight:500;color:var(--mu);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
.tab.on{color:var(--gr);border-bottom-color:var(--gr)}
.page{padding:14px;padding-bottom:100px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.card-img{width:100%;aspect-ratio:1;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:40px;overflow:hidden}
.card-img img{width:100%;height:100%;object-fit:cover}
.card-body{padding:12px}
.card-name{font-size:13px;font-weight:600;margin-bottom:3px}
.card-desc{font-size:11px;color:var(--mu);margin-bottom:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.card-price{font-size:15px;font-weight:700;color:var(--gr);font-family:monospace}
.card-stock{font-size:10px;color:var(--mu);margin-top:2px}
.add-btn{width:100%;margin-top:8px;padding:9px;background:var(--pu);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.add-btn.ok{background:var(--gr);color:#000}
.ci{background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center}
.ci-name{font-size:14px;font-weight:600}
.ci-sub{font-size:11px;color:var(--mu);margin-top:2px;font-family:monospace}
.qr{display:flex;align-items:center;gap:8px}
.qb{width:28px;height:28px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:7px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.qn{font-family:monospace;font-weight:700;min-width:20px;text-align:center}
.bar{position:fixed;bottom:0;left:0;right:0;background:var(--s1);border-top:1px solid var(--bd);padding:12px 16px;display:none}
.bar.on{display:block}
.co-btn{width:100%;padding:15px;background:var(--gr);color:#000;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
.co-btn:disabled{opacity:.6;cursor:not-allowed}
.pay-page{padding:20px;text-align:center}
.pay-h{font-size:20px;font-weight:700;margin-bottom:4px}
.pay-sub{color:var(--mu);font-size:13px;margin-bottom:20px}
.pay-qr{background:#fff;border-radius:12px;padding:12px;display:inline-block;margin-bottom:14px}
.pay-qr img{width:190px;height:190px;display:block}
.pay-amt{font-size:18px;font-weight:700;color:var(--gr);font-family:monospace;margin:8px 0}
.pay-addr{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:12px;font-family:monospace;font-size:11px;word-break:break-all;color:var(--pu);margin:10px 0;cursor:pointer;text-align:left}
.done-btn{width:100%;margin-top:16px;padding:14px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
.sp{width:15px;height:15px;border:2.5px solid rgba(0,0,0,.2);border-top-color:rgba(0,0,0,.9);border-radius:50%;animation:rot .6s linear infinite;display:inline-block}
@keyframes rot{to{transform:rotate(360deg)}}
.empty{text-align:center;color:var(--mu);padding:40px 20px;font-size:14px;line-height:1.7}
.err{color:#ff8080}
.tot-row{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:14px;display:flex;justify-content:space-between;font-weight:700;margin-top:12px}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px}
.overlay-box{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:24px;width:100%;max-width:360px}
.overlay-title{font-size:16px;font-weight:700;margin-bottom:8px}
.overlay-sub{font-size:12px;color:var(--mu);margin-bottom:16px;line-height:1.6}
.ov-input{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:12px;color:var(--tx);font-size:15px;outline:none;margin-bottom:14px;font-family:inherit}
.ov-btns{display:flex;gap:8px}
.ov-cancel{flex:1;padding:12px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit}
.ov-ok{flex:1;padding:12px;background:var(--gr);border:none;color:#000;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
</style>
</head>
<body>

<div class="topbar">
  <div>
    <div class="store-title" id="sTitle">Loading...</div>
    <div class="store-bio" id="sBio"></div>
  </div>
  <button class="cart-btn" onclick="goTab('cart')">Cart <span id="cCnt">0</span></button>
</div>
<div class="tabs">
  <button class="tab on" id="t-shop" onclick="goTab('shop',this)">Shop</button>
  <button class="tab" id="t-cart" onclick="goTab('cart',this)">My Cart</button>
</div>
<div id="pg-shop" class="page"><div id="prodGrid" class="empty">Loading products...</div></div>
<div id="pg-cart" class="page" style="display:none"><div id="cartEl" class="empty">Cart is empty.</div></div>
<div id="pg-pay" style="display:none"><div class="pay-page" id="payContent"></div></div>
<div class="bar" id="coBar"><button class="co-btn" id="coBtn" onclick="doCheckout()">Checkout · <span id="coTotal">$0.00</span></button></div>

<script>
// ── Init Telegram ──────────────────────────────────────────────────────────────
var tg = null;
try { tg = window.Telegram && window.Telegram.WebApp; if(tg){tg.ready();tg.expand();} } catch(e){}

var uid = null;
try { uid = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null; } catch(e){}

var mid = null, prods = [], cart = {}, payData = null;

// ── Get merchant param ─────────────────────────────────────────────────────────
function getParam() {
  var p = '';
  try { p = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || ''; } catch(e){}
  if (!p) {
    var u = new URLSearchParams(location.search);
    p = u.get('m') || u.get('startapp') || u.get('store') || u.get('merchant') || '';
  }
  if (p.indexOf('store_') === 0) p = p.slice(6);
  if (p.indexOf('merchant_') === 0) p = p.slice(9);
  return p;
}

// ── Main init — use DOMContentLoaded + setTimeout fallback ────────────────────
function startApp() {
  var param = getParam();
  if (!param) { loadMarketplace(); return; }
  fetch('/api/store/' + encodeURIComponent(param))
    .then(function(r){ return r.text().then(function(t){ return {ok:r.ok, text:t}; }); })
    .then(function(res){
      var d;
      try { d = JSON.parse(res.text); } catch(e){ throw new Error('Parse error'); }
      if (!res.ok) throw new Error(d.error || 'Store not found');
      mid = d.merchant.telegram_id;
      prods = d.products || [];
      document.getElementById('sTitle').textContent = d.merchant.store_name || 'Store';
      document.getElementById('sBio').textContent = d.merchant.store_bio || prods.length + ' products';
      renderProds();
    })
    .catch(function(e){
      document.getElementById('sTitle').textContent = 'Error';
      document.getElementById('prodGrid').innerHTML = '<div class="empty err">' + e.message + '</div>';
    });
}

// Run on DOMContentLoaded, and also after 300ms as fallback
document.addEventListener('DOMContentLoaded', function(){ setTimeout(startApp, 100); });
setTimeout(startApp, 500);

// ── Load marketplace (no param) ───────────────────────────────────────────────
function loadMarketplace() {
  document.getElementById('sTitle').textContent = 'Vertext Marketplace';
  document.getElementById('sBio').textContent = 'All stores';
  fetch('/api/stores')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var stores = d.stores || [];
      if (!stores.length) { document.getElementById('prodGrid').innerHTML = '<div class="empty">No stores yet.</div>'; return; }
      document.getElementById('prodGrid').innerHTML = '<div class="grid">' + stores.map(function(s){
        return '<div class="card" onclick="location.href=\'/store?m='+s.telegram_id+'\'">' +
        '<div class="card-img">🏪</div><div class="card-body">' +
        '<div class="card-name">'+(s.store_name||'Store #'+s.telegram_id)+'</div>' +
        '<div class="card-desc">'+(s.store_bio||'Tap to browse')+'</div>' +
        '<div class="card-price">'+(s.product_count||0)+' products</div>' +
        '<button class="add-btn" onclick="event.stopPropagation();location.href=\'/store?m='+s.telegram_id+'\'">Visit Store</button>' +
        '</div></div>';
      }).join('') + '</div>';
    })
    .catch(function(e){ document.getElementById('prodGrid').innerHTML = '<div class="empty err">'+e.message+'</div>'; });
}

// ── Render products ────────────────────────────────────────────────────────────
function renderProds() {
  if (!prods.length) { document.getElementById('prodGrid').innerHTML = '<div class="empty">No products available.</div>'; return; }
  document.getElementById('prodGrid').innerHTML = '<div class="grid">' + prods.map(function(p){
    return '<div class="card">' +
    '<div class="card-img">'+(p.image_url?'<img src="'+p.image_url+'" onerror="this.parentNode.textContent=\'📦\'">':'📦')+'</div>' +
    '<div class="card-body">' +
    '<div class="card-name">'+esc(p.name)+'</div>' +
    (p.description?'<div class="card-desc">'+esc(p.description)+'</div>':'') +
    '<div class="card-price">$'+Number(p.price_usd).toFixed(2)+'</div>' +
    '<div class="card-stock">'+(p.stock_count<10?'⚠️ Only '+p.stock_count+' left':p.stock_count+' in stock')+'</div>' +
    '<button class="add-btn" id="ab'+p.product_id.slice(0,8)+'" onclick="addCart(\''+p.product_id+'\',this)">Add to Cart</button>' +
    '</div></div>';
  }).join('') + '</div>';
}

// ── Cart ───────────────────────────────────────────────────────────────────────
function addCart(id, btn) {
  cart[id] = (cart[id]||0) + 1;
  updCart();
  try { if(tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light'); } catch(e){}
  btn.textContent = '✓ Added!'; btn.classList.add('ok');
  setTimeout(function(){ btn.textContent='Add to Cart'; btn.classList.remove('ok'); }, 800);
}

function updCart() {
  var tot = Object.values(cart).reduce(function(s,q){return s+q;},0);
  var usd = Object.entries(cart).reduce(function(s,e){
    var p=prods.find(function(x){return x.product_id===e[0];});
    return s+(p?p.price_usd*e[1]:0);
  },0);
  document.getElementById('cCnt').textContent = tot;
  var el=document.getElementById('coTotal'); if(el) el.textContent='$'+usd.toFixed(2);
  document.getElementById('coBar').className='bar'+(tot>0?' on':'');
  renderCart();
}

function renderCart() {
  var el=document.getElementById('cartEl');
  var entries=Object.entries(cart).filter(function(e){return e[1]>0;});
  if (!entries.length) { el.innerHTML='<div class="empty">Cart is empty.</div>'; return; }
  var usd=entries.reduce(function(s,e){var p=prods.find(function(x){return x.product_id===e[0];});return s+(p?p.price_usd*e[1]:0);},0);
  el.innerHTML=entries.map(function(e){
    var p=prods.find(function(x){return x.product_id===e[0];}); if(!p) return '';
    return '<div class="ci"><div><div class="ci-name">'+esc(p.name)+'</div><div class="ci-sub">$'+p.price_usd.toFixed(2)+' each</div></div>' +
    '<div class="qr"><button class="qb" onclick="chgQty(\''+e[0]+'\',-1)">−</button><span class="qn">'+e[1]+'</span><button class="qb" onclick="chgQty(\''+e[0]+'\',1)">+</button></div></div>';
  }).join('')+'<div class="tot-row"><span>Total</span><span style="color:var(--gr);font-family:monospace">$'+usd.toFixed(2)+' USD</span></div>';
}

function chgQty(id,d){ cart[id]=(cart[id]||0)+d; if(cart[id]<=0) delete cart[id]; updCart(); }

// ── Checkout ───────────────────────────────────────────────────────────────────
function doCheckout() {
  var custId = uid || parseInt(localStorage.getItem('vxt_tgid')||'0')||0;
  if (!custId) { showTgIdOverlay(function(id){ showNetworkPicker(id); }); return; }
  showNetworkPicker(custId);
}

var NETWORKS = [
  {label:'USDT TRC20 (Tron)', code:'usdttrc20'},
  {label:'USDT BEP20 (BSC)', code:'usdtbsc'},
  {label:'USDT Polygon', code:'usdtmatic'},
  {label:'Bitcoin (BTC)', code:'btc'},
  {label:'Ethereum (ETH)', code:'eth'},
  {label:'BNB', code:'bnb'},
  {label:'Solana (SOL)', code:'sol'},
  {label:'XRP', code:'xrp'},
  {label:'Dogecoin (DOGE)', code:'doge'},
  {label:'Litecoin (LTC)', code:'ltc'},
  {label:'TRON (TRX)', code:'trx'},
  {label:'MATIC', code:'matic'},
];

function showNetworkPicker(custId) {
  var ov=document.createElement('div'); ov.className='overlay'; ov.id='netov';
  var btns=NETWORKS.map(function(n){
    return '<button onclick="selectNetwork(''+n.code+'','+custId+')" style="width:100%;padding:12px 16px;background:var(--s2);border:1px solid var(--bd);border-radius:10px;color:var(--tx);font-size:14px;cursor:pointer;font-family:inherit;text-align:left;margin-bottom:8px">'+n.label+'</button>';
  }).join('');
  ov.innerHTML='<div class="overlay-box" style="max-height:85vh;overflow-y:auto">' +
    '<div class="overlay-title" style="margin-bottom:16px">Select Payment Currency</div>' +
    btns +
    '<button onclick="document.getElementById('netov').remove()" style="width:100%;padding:12px;background:transparent;border:1px solid var(--bd);border-radius:10px;color:var(--mu);font-size:14px;cursor:pointer;font-family:inherit;margin-top:4px">Cancel</button>' +
    '</div>';
  document.body.appendChild(ov);
}

function selectNetwork(currency, custId) {
  var ov=document.getElementById('netov'); if(ov) ov.remove();
  runCheckout(custId, currency);
}

function showTgIdOverlay(cb) {
  window._tgCb = cb || null;
  var ov=document.createElement('div'); ov.className='overlay'; ov.id='tgov';
  ov.innerHTML='<div class="overlay-box">' +
    '<div class="overlay-title">Enter Your Telegram ID</div>' +
    '<div class="overlay-sub">Get your ID by messaging @userinfobot on Telegram</div>' +
    '<input class="ov-input" id="tgid-in" type="number" placeholder="e.g. 123456789">' +
    '<div class="ov-btns">' +
    '<button class="ov-cancel" onclick="document.getElementById(\'tgov\').remove()">Cancel</button>' +
    '<button class="ov-ok" onclick="saveTgId()">Continue</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  setTimeout(function(){ var i=document.getElementById('tgid-in'); if(i) i.focus(); },100);
}

function saveTgId() {
  var v=document.getElementById('tgid-in').value.trim();
  if(!v||isNaN(parseInt(v))){ alert('Enter a valid Telegram ID'); return; }
  localStorage.setItem('vxt_tgid',v);
  document.getElementById('tgov').remove();
  if(window._tgCb) { window._tgCb(parseInt(v)); } else { showNetworkPicker(parseInt(v)); }
}

function runCheckout(custId, currency) {
  currency = currency || 'usdttrc20';
  var entries=Object.entries(cart).filter(function(e){return e[1]>0;});
  if(!entries.length) return;
  var btn=document.getElementById('coBtn');
  btn.disabled=true; btn.innerHTML='<span class="sp"></span> Processing...';
  var payload={merchant_id:mid, customer_tg_id:custId, pay_currency:currency, cart:entries.map(function(e){return {product_id:e[0],quantity:e[1]};})};
  fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){ return r.text().then(function(t){return {ok:r.ok,text:t,status:r.status};}); })
    .then(function(res){
      var d; try{d=JSON.parse(res.text);}catch(e){throw new Error('Server error ('+res.status+'): '+res.text.slice(0,100));}
      if(!res.ok) throw new Error(d.error||'Checkout failed HTTP '+res.status);
      payData=d; cart={}; updCart(); showPayScreen(d);
    })
    .catch(function(e){
      btn.disabled=false; btn.innerHTML='Checkout · '+document.getElementById('coTotal').textContent;
      alert('Error: '+e.message);
    });
}

var payTimer = null;
var payExpiry = null;

function showPayScreen(d) {
  document.getElementById('pg-shop').style.display='none';
  document.getElementById('pg-cart').style.display='none';
  document.querySelector('.tabs').style.display='none';
  document.getElementById('coBar').className='bar';
  document.getElementById('pg-pay').style.display='block';
  payExpiry = Date.now() + 20*60*1000;
  var qrHtml=d.qr_base64?'<div class="pay-qr"><img src="data:image/png;base64,'+d.qr_base64+'" style="width:190px;height:190px"></div>':'';
  document.getElementById('payContent').innerHTML=
    '<div class="pay-h">Payment Request</div>' +
    '<div class="pay-sub">Order #'+(d.order_id||'').slice(0,8).toUpperCase()+'</div>' +
    qrHtml +
    '<div class="pay-amt">'+(d.pay_amount||'?')+' '+(d.pay_currency||'USDT').toUpperCase()+'</div>' +
    '<div class="pay-addr" onclick="copyAddr()">'+(d.pay_address||'')+'</div>' +
    '<div style="font-size:11px;color:var(--mu);margin-bottom:4px">Tap address to copy</div>' +
    '<div id="payTimer" style="font-family:monospace;font-size:14px;color:var(--yw);margin:8px 0;padding:8px;background:var(--s1);border-radius:8px;border:1px solid var(--bd)">⏱ 20:00 remaining</div>' +
    '<div id="payStatus" style="font-size:13px;color:var(--mu);margin:8px 0;padding:10px;background:var(--s1);border-radius:8px;border:1px solid var(--bd)">⏳ Waiting for payment...</div>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
    '<button onclick="checkPayStatus()" style="flex:1;padding:12px;background:var(--pu);border:none;color:#fff;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Check Status</button>' +
    '<button onclick="closePay()" style="flex:1;padding:12px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:10px;font-size:13px;cursor:pointer;font-family:inherit">Close</button>' +
    '</div>';

  // Start countdown timer
  if (payTimer) clearInterval(payTimer);
  payTimer = setInterval(function(){
    var left = payExpiry - Date.now();
    var el = document.getElementById('payTimer');
    if (!el) { clearInterval(payTimer); return; }
    if (left <= 0) {
      clearInterval(payTimer);
      el.textContent = '⛔ Payment window expired';
      el.style.color = 'var(--re)';
      document.getElementById('payStatus').textContent = '⛔ Invoice expired. Please restart checkout.';
      return;
    }
    var mins = Math.floor(left/60000);
    var secs = Math.floor((left%60000)/1000);
    el.textContent = '⏱ ' + (mins<10?'0':'')+mins + ':' + (secs<10?'0':'')+secs + ' remaining';
    el.style.color = left < 3*60*1000 ? 'var(--re)' : left < 5*60*1000 ? 'var(--yw)' : 'var(--gr)';
  }, 1000);

  // Auto-check status every 15s
  if (window._statusPoll) clearInterval(window._statusPoll);
  if (d.invoice_id) {
    window._statusPoll = setInterval(function(){ checkPayStatusSilent(d.invoice_id); }, 15000);
  }
}

function checkPayStatus() {
  if (!payData || !payData.invoice_id) return;
  var el = document.getElementById('payStatus');
  if (el) el.textContent = '🔄 Checking payment...';
  checkPayStatusSilent(payData.invoice_id, true);
}

function checkPayStatusSilent(invoiceId, showResult) {
  fetch('/api/payment-status/' + invoiceId)
    .then(function(r){ return r.json(); })
    .then(function(d){
      var el = document.getElementById('payStatus');
      if (!el) return;
      var status = d.status || 'waiting';
      var msgs = {
        waiting:'⏳ Waiting for payment on the blockchain...',
        confirming:'🔄 Payment detected! Waiting for confirmations...',
        confirmed:'✅ Payment confirmed! Processing...',
        sending:'📤 Sending to merchant...',
        finished:'🎉 Payment complete!',
        paid:'🎉 Payment complete!',
        failed:'❌ Payment failed. Please try again.',
        expired:'⛔ Payment expired.'
      };
      el.textContent = msgs[status] || '⏳ Status: ' + status;
      if (status === 'finished' || status === 'paid' || status === 'confirmed') {
        el.style.color = 'var(--gr)';
        if (payTimer) clearInterval(payTimer);
        if (window._statusPoll) clearInterval(window._statusPoll);
        var timerEl = document.getElementById('payTimer');
        if (timerEl) { timerEl.textContent = '✅ Payment Confirmed!'; timerEl.style.color = 'var(--gr)'; }
      }
    })
    .catch(function(){ if(showResult){ var el=document.getElementById('payStatus'); if(el) el.textContent='⚠️ Could not check status. Try again.'; } });
}

function closePay() { try{if(tg)tg.close();}catch(e){} history.back(); }

function copyAddr() {
  var addr=payData&&payData.pay_address?payData.pay_address:'';
  navigator.clipboard.writeText(addr).then(function(){
    var el=document.querySelector('.pay-addr'); if(!el) return;
    var o=el.textContent; el.textContent='✓ Copied!'; el.style.color='var(--gr)';
    setTimeout(function(){el.textContent=o;el.style.color='';},1500);
  }).catch(function(){ alert('Address: '+addr); });
}

function goTab(name,btn) {
  document.getElementById('pg-shop').style.display=name==='shop'?'block':'none';
  document.getElementById('pg-cart').style.display=name==='cart'?'block':'none';
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on');});
  var t=document.getElementById('t-'+name); if(t) t.classList.add('on');
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
</script>
</body>
</html>`;
}
