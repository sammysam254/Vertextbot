export function getDashboardHTML(): string {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Vertext — Dashboard</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{--bg:#080810;--s1:#0f0f1c;--s2:#161628;--bd:#1e1e35;--gr:#00e676;--pu:#7c4dff;--re:#ff5252;--yw:#ffab40;--tx:#e8e8f0;--mu:#6b6b8a}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--tx);min-height:100vh}
/* ---- AUTH ---- */
.auth{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.logo{font-family:monospace;font-size:32px;color:var(--gr);margin-bottom:6px;letter-spacing:-2px}
.tagline{color:var(--mu);font-size:13px;margin-bottom:40px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:20px;padding:28px;width:100%;max-width:400px}
.card-title{font-size:17px;font-weight:600;margin-bottom:6px}
.card-sub{color:var(--mu);font-size:13px;margin-bottom:22px;line-height:1.6}
.field{margin-bottom:16px}
.field label{display:block;font-size:11px;color:var(--mu);font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.field input{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:13px 16px;color:var(--tx);font-size:15px;outline:none;transition:border-color .2s}
.field input:focus{border-color:var(--pu)}
/* ---- BUTTONS ---- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;text-decoration:none}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn-full{width:100%}
.btn-primary{background:var(--gr);color:#000}
.btn-primary:hover:not(:disabled){background:#00c853}
.btn-secondary{background:var(--s2);color:var(--tx);border:1px solid var(--bd)}
.btn-secondary:hover:not(:disabled){border-color:var(--pu)}
.btn-danger{background:transparent;color:var(--re);border:1px solid var(--re)}
.btn-sm{padding:8px 14px;font-size:12px;border-radius:8px}
/* ---- SPINNER ---- */
.spin{width:15px;height:15px;border:2.5px solid rgba(0,0,0,.25);border-top-color:rgba(0,0,0,.9);border-radius:50%;animation:rot .65s linear infinite;flex-shrink:0}
.spin-light{border-color:rgba(255,255,255,.2);border-top-color:#fff}
@keyframes rot{to{transform:rotate(360deg)}}
/* ---- ALERTS ---- */
.alert{padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;line-height:1.5}
.alert-error{background:#1a0000;border:1px solid var(--re);color:#ff8a80}
.alert-success{background:#003322;border:1px solid var(--gr);color:#69f0ae}
.alert-info{background:#001a3a;border:1px solid var(--pu);color:#b388ff}
/* ---- APP ---- */
.app{display:none;flex-direction:column;min-height:100vh}
.app.show{display:flex}
.topbar{background:var(--s1);border-bottom:1px solid var(--bd);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.topbar-logo{font-family:monospace;font-size:17px;color:var(--gr);letter-spacing:-1px}
.nav{background:var(--s1);border-bottom:1px solid var(--bd);display:flex;overflow-x:auto;padding:0 8px;gap:2px;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-item{padding:11px 15px;font-size:13px;font-weight:500;color:var(--mu);background:none;border:none;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all .15s;font-family:inherit}
.nav-item.on{color:var(--gr);border-bottom-color:var(--gr)}
.main{flex:1;padding:20px;max-width:800px;width:100%;margin:0 auto}
/* ---- COMPONENTS ---- */
.sect{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:20px;margin-bottom:16px}
.sect-label{font-size:10px;font-family:monospace;color:var(--mu);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
.bal{font-size:38px;font-weight:700;font-family:monospace;color:var(--gr);line-height:1}
.bal-sub{font-size:13px;color:var(--mu);margin-top:4px}
.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.stat{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:14px;text-align:center}
.stat-val{font-size:22px;font-weight:700;font-family:monospace}
.stat-sub{font-size:10px;color:var(--mu);margin-top:3px}
.inv-item{background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:15px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:border-color .15s}
.inv-item:hover{border-color:var(--pu)}
.inv-desc{font-size:13px;font-weight:500;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.inv-meta{font-size:11px;color:var(--mu);margin-top:3px;font-family:monospace}
.inv-amt{font-size:15px;font-weight:700;font-family:monospace;text-align:right}
.badge{display:inline-block;padding:3px 9px;border-radius:6px;font-size:9px;font-weight:700;font-family:monospace;margin-top:4px}
.badge-PAID{background:#003322;color:var(--gr)}
.badge-PENDING{background:#1a1200;color:var(--yw)}
.badge-EXPIRED{background:#1a0000;color:var(--re)}
.fgroup{margin-bottom:18px}
.fgroup label{display:block;font-size:11px;color:var(--mu);font-family:monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.fgroup input,.fgroup textarea,.fgroup select{width:100%;background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:12px 16px;color:var(--tx);font-size:15px;font-family:inherit;outline:none;transition:border-color .2s}
.fgroup input:focus,.fgroup textarea:focus{border-color:var(--pu)}
.fgroup textarea{resize:vertical;min-height:80px}
.fee-box{background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:15px;margin:12px 0;display:none}
.fee-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--mu)}
.fee-row.total{border-top:1px solid var(--bd);margin-top:8px;padding-top:10px;font-weight:700;color:var(--gr)}
.key-box{background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:15px;font-family:monospace;font-size:12px;word-break:break-all;color:var(--gr);margin:12px 0;line-height:1.6}
.link-box{background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:14px;font-family:monospace;font-size:12px;word-break:break-all;color:var(--pu);margin:12px 0}
.row2{display:flex;gap:8px;flex-wrap:wrap}
.empty{text-align:center;color:var(--mu);padding:36px;font-size:14px}
.footer-links{margin-top:16px;text-align:center;font-size:12px;color:var(--mu)}
.footer-links a{color:var(--mu);text-decoration:none;margin:0 8px}
.footer-links a:hover{color:var(--gr)}
@media(max-width:480px){.row3{grid-template-columns:1fr 1fr}.main{padding:12px}.bal{font-size:30px}}
</style>
</head>
<body>

<!-- AUTH -->
<div class="auth" id="authScreen">
  <div class="logo">VERTEXT</div>
  <div class="tagline">Crypto Escrow & Invoicing Platform</div>
  <div class="card">
    <div class="card-title">Merchant Login</div>
    <div class="card-sub">Enter your Telegram ID and API key. Generate your key by sending /apikey to the bot.</div>
    <div id="authAlert"></div>
    <div class="field">
      <label>Telegram ID</label>
      <input type="number" id="inTgId" placeholder="e.g. 123456789">
    </div>
    <div class="field">
      <label>API Key</label>
      <input type="text" id="inApiKey" placeholder="vxt_...">
    </div>
    <button class="btn btn-primary btn-full" id="loginBtn" onclick="doLogin()">Access Dashboard</button>
    <div class="footer-links" style="margin-top:20px">
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/api-docs">API Docs</a>
    </div>
  </div>
</div>

<!-- APP -->
<div class="app" id="appScreen">
  <div class="topbar">
    <div class="topbar-logo">VERTEXT</div>
    <button class="btn btn-secondary btn-sm" onclick="doLogout()">Logout</button>
  </div>
  <nav class="nav">
    <button class="nav-item on" onclick="goTab('overview',this)">Overview</button>
    <button class="nav-item" onclick="goTab('invoices',this)">Invoices</button>
    <button class="nav-item" onclick="goTab('create',this)">Create Invoice</button>
    <button class="nav-item" onclick="goTab('wallet',this)">Wallet</button>
    <button class="nav-item" onclick="goTab('api',this)">API Settings</button>
  </nav>
  <div class="main">
    <div id="globalAlert"></div>

    <!-- OVERVIEW -->
    <div id="tab-overview">
      <div class="sect">
        <div class="sect-label">Available Balance</div>
        <div class="bal" id="ovBal">—</div>
        <div class="bal-sub" id="ovSub">USDT</div>
        <div class="row2" style="margin-top:16px">
          <button class="btn btn-primary btn-sm" onclick="goTab('wallet',null)">Withdraw</button>
          <button class="btn btn-secondary btn-sm" onclick="goTab('create',null)">+ New Invoice</button>
        </div>
      </div>
      <div class="row3">
        <div class="stat"><div class="stat-val" id="ovTotal">—</div><div class="stat-sub">Invoices</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--gr)" id="ovPaid">—</div><div class="stat-sub">Paid</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--yw)" id="ovPend">—</div><div class="stat-sub">Pending</div></div>
      </div>
      <div class="sect-label" style="margin-bottom:10px">Recent Invoices</div>
      <div id="ovList"><div class="empty">Loading...</div></div>
    </div>

    <!-- INVOICES -->
    <div id="tab-invoices" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-size:18px;font-weight:700">My Invoices</div>
        <button class="btn btn-primary btn-sm" onclick="goTab('create',null)">+ New</button>
      </div>
      <div id="invList"><div class="empty">Loading...</div></div>
    </div>

    <!-- CREATE INVOICE -->
    <div id="tab-create" style="display:none">
      <div style="font-size:18px;font-weight:700;margin-bottom:18px">Create Invoice</div>
      <div class="sect">
        <div id="createAlert"></div>
        <div class="fgroup">
          <label>Amount (USD)</label>
          <input type="number" id="cAmount" placeholder="50.00" min="1" step="0.01">
        </div>
        <div class="fgroup">
          <label>Description</label>
          <textarea id="cDesc" placeholder="e.g. Website design deposit"></textarea>
        </div>
        <button class="btn btn-primary btn-full" id="createBtn" onclick="doCreateInvoice()">Generate Invoice Link</button>
      </div>
      <div id="createResult" style="display:none">
        <div class="sect">
          <div class="sect-label">Invoice Created</div>
          <div class="link-box" id="createLink"></div>
          <div class="row2">
            <button class="btn btn-secondary btn-sm" onclick="doCopyLink()">Copy Link</button>
            <button class="btn btn-secondary btn-sm" onclick="window.open(currentLink,'_blank')">Open</button>
          </div>
        </div>
      </div>
    </div>

    <!-- WALLET -->
    <div id="tab-wallet" style="display:none">
      <div style="font-size:18px;font-weight:700;margin-bottom:18px">My Wallet</div>
      <div class="sect">
        <div class="sect-label">Balance</div>
        <div class="bal" id="wBal">—</div>
        <div style="font-size:13px;color:var(--mu);margin-top:6px">Network: <span id="wNet">—</span></div>
        <div style="font-size:12px;color:var(--mu);margin-top:2px;font-family:monospace;word-break:break-all" id="wAddr">—</div>
        <div style="font-size:13px;color:var(--re);margin-top:6px">Locked (disputes): <span id="wLocked">$0.0000</span></div>
      </div>
      <div class="sect">
        <div class="sect-label">Withdraw Funds</div>
        <div id="wAlert"></div>
        <div class="fgroup">
          <label>Amount (USD)</label>
          <input type="number" id="wAmount" placeholder="e.g. 45.00" min="0.01" step="0.01">
        </div>
        <div class="fee-box" id="feeBox">
          <div class="fee-row"><span>Requested</span><span id="fGross">—</span></div>
          <div class="fee-row"><span>Network Fee</span><span id="fNet2">~$1.00</span></div>
          <div class="fee-row"><span>Platform Fee</span><span>$1.00</span></div>
          <div class="fee-row total"><span>You Receive</span><span id="fNet">—</span></div>
        </div>
        <div class="row2">
          <button class="btn btn-secondary" style="flex:1" onclick="doCalcFees()">Calculate Fees</button>
          <button class="btn btn-primary" style="flex:1" id="wdBtn" onclick="doWithdraw()" disabled>Withdraw</button>
        </div>
        <div style="font-size:12px;color:var(--mu);margin-top:10px">A confirmation will be sent to your Telegram.</div>
      </div>
      <div class="sect">
        <div class="sect-label">Withdrawal History</div>
        <div id="wdHist"><div class="empty">Loading...</div></div>
      </div>
    </div>

    <!-- API SETTINGS -->
    <div id="tab-api" style="display:none">
      <div style="font-size:18px;font-weight:700;margin-bottom:18px">API Settings</div>
      <div class="sect">
        <div class="sect-label">API Key</div>
        <div id="apiKeyBox"><div style="color:var(--mu);font-size:13px">No key generated yet.</div></div>
        <div class="row2" style="margin-top:14px">
          <button class="btn btn-primary btn-sm" id="genKeyBtn" onclick="doGenKey()">Generate New Key</button>
          <button class="btn btn-secondary btn-sm" id="copyKeyBtn" style="display:none" onclick="doCopyKey()">Copy Key</button>
        </div>
      </div>
      <div class="sect">
        <div class="sect-label">Webhook URL</div>
        <div id="whDisplay" style="font-size:13px;color:var(--mu);margin-bottom:12px">Not configured</div>
        <div class="fgroup">
          <label>Set Webhook URL (HTTPS only)</label>
          <input type="url" id="whInput" placeholder="https://yoursite.com/webhook">
        </div>
        <div class="row2">
          <button class="btn btn-primary btn-sm" id="saveWhBtn" onclick="doSaveWebhook()">Save</button>
          <button class="btn btn-danger btn-sm" id="delWhBtn" onclick="doDelWebhook()">Remove</button>
        </div>
      </div>
      <div class="sect">
        <div class="sect-label">Documentation</div>
        <div style="font-size:13px;color:var(--mu);margin-bottom:12px">Build integrations with the Vertext REST API.</div>
        <a href="/api-docs" target="_blank" class="btn btn-secondary btn-sm">View API Docs →</a>
      </div>
    </div>

  </div>
</div>

<script>
// ── State ────────────────────────────────────────────────────────────────────
let S = { userId: null, apiKey: null };
let currentLink = '';
let currentApiKey = '';

// ── Spinner helper ────────────────────────────────────────────────────────────
function btnLoad(id, on, label) {
  const b = typeof id === 'string' ? document.getElementById(id) : id;
  if (!b) return;
  b.disabled = on;
  if (on) {
    b._orig = b.innerHTML;
    const spinClass = b.classList.contains('btn-primary') ? 'spin' : 'spin spin-light';
    b.innerHTML = '<span class="' + spinClass + '"></span>' + (label || 'Loading...');
  } else {
    b.innerHTML = b._orig || label || 'Submit';
  }
}

function alert_(containerId, msg, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!msg) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="alert alert-' + type + '">' + msg + '</div>';
}

function gAlert(msg, type) {
  alert_('globalAlert', msg, type);
  if (msg) setTimeout(() => alert_('globalAlert', '', ''), 5000);
}

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }

  const tgUser = tg?.initDataUnsafe?.user;
  if (tgUser?.id) {
    S.userId = tgUser.id;
    S.apiKey = 'tg_auth';
    await loadAndShow();
    return;
  }

  const saved = localStorage.getItem('vxt_s');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      S = p;
      const ok = await loadAndShow();
      if (!ok) { localStorage.removeItem('vxt_s'); showAuth(); }
    } catch { showAuth(); }
  } else { showAuth(); }
});

function showAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appScreen').classList.remove('show');
}

async function loadAndShow() {
  const res = await fetch('/api/dashboard?user_id=' + S.userId + '&api_key=' + S.apiKey).catch(() => null);
  if (!res || !res.ok) return false;
  const data = await res.json();
  renderApp(data);
  return true;
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function doLogin() {
  const tgId = document.getElementById('inTgId').value.trim();
  const key = document.getElementById('inApiKey').value.trim();
  if (!tgId || !key) { alert_('authAlert', 'Please enter both Telegram ID and API key.', 'error'); return; }

  btnLoad('loginBtn', true, 'Connecting...');
  alert_('authAlert', 'Verifying credentials...', 'info');

  try {
    const res = await fetch('/api/dashboard?user_id=' + tgId + '&api_key=' + key);
    const data = await res.json();

    if (!res.ok) {
      alert_('authAlert', data.error || 'Login failed. Check your credentials.', 'error');
      btnLoad('loginBtn', false, 'Access Dashboard');
      return;
    }

    S = { userId: parseInt(tgId), apiKey: key };
    localStorage.setItem('vxt_s', JSON.stringify(S));
    alert_('authAlert', '', '');
    renderApp(data);
  } catch (e) {
    alert_('authAlert', 'Connection error: ' + e.message, 'error');
    btnLoad('loginBtn', false, 'Access Dashboard');
  }
}

function doLogout() {
  localStorage.removeItem('vxt_s');
  S = { userId: null, apiKey: null };
  document.getElementById('appScreen').classList.remove('show');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('loginBtn').innerHTML = 'Access Dashboard';
  document.getElementById('loginBtn').disabled = false;
}

// ── Render App ────────────────────────────────────────────────────────────────
function renderApp(data) {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').classList.add('show');
  const m = data.merchant;
  const inv = data.invoices || [];
  const paid = inv.filter(i => i.status === 'PAID').length;
  const pend = inv.filter(i => i.status === 'PENDING').length;
  document.getElementById('ovBal').textContent = '$' + Number(m.internal_balance).toFixed(4);
  document.getElementById('ovSub').textContent = 'USDT on ' + m.payout_network;
  document.getElementById('ovTotal').textContent = inv.length;
  document.getElementById('ovPaid').textContent = paid;
  document.getElementById('ovPend').textContent = pend;
  document.getElementById('wBal').textContent = '$' + Number(m.internal_balance).toFixed(4);
  document.getElementById('wNet').textContent = m.payout_network;
  document.getElementById('wAddr').textContent = m.payout_address || '—';
  document.getElementById('wLocked').textContent = '$' + Number(m.locked_amount || 0).toFixed(4);
  renderInvList(inv.slice(0, 5), 'ovList');
  renderInvList(inv, 'invList');
  if (m.api_key) {
    currentApiKey = m.api_key;
    document.getElementById('apiKeyBox').innerHTML = '<div class="key-box">' + m.api_key + '</div><div style="font-size:12px;color:var(--mu)">Use this to authenticate API requests.</div>';
    document.getElementById('copyKeyBtn').style.display = 'inline-flex';
  }
  if (m.webhook_url) {
    document.getElementById('whDisplay').textContent = m.webhook_url;
    document.getElementById('whInput').value = m.webhook_url;
  }
  loadWdHistory();
}

// ── Tab Navigation ─────────────────────────────────────────────────────────────
function goTab(name, btnEl) {
  document.querySelectorAll('[id^="tab-"]').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + name).style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('on'));
  if (btnEl) btnEl.classList.add('on');
  else {
    const tabs = ['overview','invoices','create','wallet','api'];
    const btn = document.querySelectorAll('.nav-item')[tabs.indexOf(name)];
    if (btn) btn.classList.add('on');
  }
  if (name === 'wallet') loadWdHistory();
}

// ── Invoice List ──────────────────────────────────────────────────────────────
function renderInvList(arr, containerId) {
  const el = document.getElementById(containerId);
  if (!arr.length) { el.innerHTML = '<div class="empty">No invoices yet.</div>'; return; }
  el.innerHTML = arr.map(inv => {
    const s = inv.status || 'PENDING';
    const link = 'https://t.me/' + 'Vertextmarketbot' + '?start=inv_' + inv.invoice_id;
    return '<div class="inv-item" onclick="navigator.clipboard.writeText(\'' + link + '\').then(()=>gAlert(\'Link copied!\',\'success\'))">' +
      '<div><div class="inv-desc">' + (inv.description || '').slice(0, 40) + '</div>' +
      '<div class="inv-meta">' + new Date(inv.created_at).toLocaleDateString() + '</div></div>' +
      '<div style="text-align:right"><div class="inv-amt">$' + Number(inv.amount_fiat).toFixed(2) + '</div>' +
      '<span class="badge badge-' + s + '">' + s + '</span></div></div>';
  }).join('');
}

// ── Create Invoice ─────────────────────────────────────────────────────────────
async function doCreateInvoice() {
  const amount = parseFloat(document.getElementById('cAmount').value);
  const desc = document.getElementById('cDesc').value.trim();
  if (!amount || amount < 1) { alert_('createAlert', 'Minimum amount is $1.00', 'error'); return; }
  if (!desc) { alert_('createAlert', 'Please enter a description.', 'error'); return; }

  btnLoad('createBtn', true, 'Creating...');
  alert_('createAlert', 'Creating invoice...', 'info');
  document.getElementById('createResult').style.display = 'none';

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': S.userId, 'X-Api-Key': S.apiKey },
      body: JSON.stringify({ amount, description: desc }),
    });
    const data = await res.json();
    btnLoad('createBtn', false, 'Generate Invoice Link');
    if (!res.ok) { alert_('createAlert', data.error || 'Failed to create invoice.', 'error'); return; }
    alert_('createAlert', 'Invoice created!', 'success');
    currentLink = data.link;
    document.getElementById('createLink').textContent = data.link;
    document.getElementById('createResult').style.display = 'block';
  } catch (e) {
    btnLoad('createBtn', false, 'Generate Invoice Link');
    alert_('createAlert', 'Error: ' + e.message, 'error');
  }
}

function doCopyLink() { navigator.clipboard.writeText(currentLink).then(() => gAlert('Link copied!', 'success')); }

// ── Wallet ─────────────────────────────────────────────────────────────────────
async function loadWdHistory() {
  try {
    const res = await fetch('/api/withdrawals?user_id=' + S.userId + '&api_key=' + S.apiKey);
    const data = await res.json();
    const wds = data.withdrawals || [];
    document.getElementById('wdHist').innerHTML = wds.length ? wds.slice(0,10).map(w =>
      '<div class="inv-item"><div><div class="inv-desc">Withdrawal</div><div class="inv-meta">' + new Date(w.created_at).toLocaleDateString() + '</div></div>' +
      '<div style="text-align:right"><div class="inv-amt">$' + Number(w.net_payout).toFixed(4) + '</div>' +
      '<span class="badge badge-' + (w.status === 'COMPLETED' ? 'PAID' : 'PENDING') + '">' + w.status + '</span></div></div>'
    ).join('') : '<div class="empty">No withdrawals yet.</div>';
  } catch {}
}

function doCalcFees() {
  const amount = parseFloat(document.getElementById('wAmount').value);
  if (!amount || amount <= 0) { alert_('wAlert', 'Enter a valid amount first.', 'error'); return; }
  const net = amount - 2.0;
  if (net <= 0) { alert_('wAlert', 'Amount too small. Minimum: $2.01', 'error'); return; }
  document.getElementById('fGross').textContent = '$' + amount.toFixed(4);
  document.getElementById('fNet').textContent = '$' + net.toFixed(4) + ' USDT';
  document.getElementById('feeBox').style.display = 'block';
  document.getElementById('wdBtn').disabled = false;
  alert_('wAlert', '', '');
}

async function doWithdraw() {
  const amount = parseFloat(document.getElementById('wAmount').value);
  if (!amount) return;
  btnLoad('wdBtn', true, 'Sending...');
  alert_('wAlert', 'Processing withdrawal...', 'info');
  try {
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': S.userId, 'X-Api-Key': S.apiKey },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    btnLoad('wdBtn', false, 'Withdraw');
    if (!res.ok) { alert_('wAlert', data.error || 'Failed.', 'error'); document.getElementById('wdBtn').disabled = false; return; }
    alert_('wAlert', 'Withdrawal sent! Check Telegram to confirm.', 'success');
  } catch (e) {
    btnLoad('wdBtn', false, 'Withdraw');
    document.getElementById('wdBtn').disabled = false;
    alert_('wAlert', 'Error: ' + e.message, 'error');
  }
}

// ── API Settings ──────────────────────────────────────────────────────────────
async function doGenKey() {
  btnLoad('genKeyBtn', true, 'Generating...');
  try {
    const res = await fetch('/api/apikey', {
      method: 'POST',
      headers: { 'X-Merchant-Id': S.userId, 'X-Api-Key': S.apiKey || 'none' },
    });
    const data = await res.json();
    btnLoad('genKeyBtn', false, 'Generate New Key');
    if (!res.ok) { gAlert(data.error || 'Failed.', 'error'); return; }
    currentApiKey = data.api_key;
    S.apiKey = data.api_key;
    localStorage.setItem('vxt_s', JSON.stringify(S));
    document.getElementById('apiKeyBox').innerHTML = '<div class="key-box">' + data.api_key + '</div><div style="font-size:12px;color:var(--mu);margin-top:6px">Copy and save this key — use it to login to this dashboard.</div>';
    document.getElementById('copyKeyBtn').style.display = 'inline-flex';
    gAlert('API key generated! Copy it now.', 'success');
  } catch (e) {
    btnLoad('genKeyBtn', false, 'Generate New Key');
    gAlert('Error: ' + e.message, 'error');
  }
}

function doCopyKey() { navigator.clipboard.writeText(currentApiKey).then(() => gAlert('API key copied!', 'success')); }

async function doSaveWebhook() {
  const url = document.getElementById('whInput').value.trim();
  if (!url.startsWith('https://')) { gAlert('Webhook URL must use HTTPS.', 'error'); return; }
  btnLoad('saveWhBtn', true, 'Saving...');
  try {
    const res = await fetch('/api/webhook-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': S.userId, 'X-Api-Key': S.apiKey },
      body: JSON.stringify({ webhook_url: url }),
    });
    btnLoad('saveWhBtn', false, 'Save');
    const data = await res.json();
    if (!res.ok) { gAlert(data.error || 'Failed.', 'error'); return; }
    document.getElementById('whDisplay').textContent = url;
    gAlert('Webhook URL saved!', 'success');
  } catch (e) { btnLoad('saveWhBtn', false, 'Save'); gAlert('Error: ' + e.message, 'error'); }
}

async function doDelWebhook() {
  btnLoad('delWhBtn', true, 'Removing...');
  try {
    await fetch('/api/webhook-url', { method: 'DELETE', headers: { 'X-Merchant-Id': S.userId, 'X-Api-Key': S.apiKey } });
    btnLoad('delWhBtn', false, 'Remove');
    document.getElementById('whDisplay').textContent = 'Not configured';
    document.getElementById('whInput').value = '';
    gAlert('Webhook removed.', 'success');
  } catch (e) { btnLoad('delWhBtn', false, 'Remove'); gAlert('Error: ' + e.message, 'error'); }
}
</script>
</body>
</html>`;
}
