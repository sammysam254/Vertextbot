export function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Vertext — Merchant Dashboard</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #080810;
  --surface: #0f0f1c;
  --surface2: #161628;
  --border: #1e1e35;
  --accent: #00e676;
  --accent2: #7c4dff;
  --danger: #ff5252;
  --warn: #ffab40;
  --text: #e8e8f0;
  --muted: #6b6b8a;
  --mono: 'Space Mono', monospace;
  --sans: 'DM Sans', sans-serif;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:var(--sans); background:var(--bg); color:var(--text); min-height:100vh; }

/* Auth Screen */
.auth-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
.auth-logo { font-family:var(--mono); font-size:32px; color:var(--accent); margin-bottom:8px; letter-spacing:-2px; }
.auth-sub { color:var(--muted); font-size:14px; margin-bottom:40px; }
.auth-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:32px; width:100%; max-width:400px; }
.auth-title { font-size:18px; font-weight:600; margin-bottom:6px; }
.auth-desc { color:var(--muted); font-size:13px; margin-bottom:24px; line-height:1.6; }
.field { margin-bottom:16px; }
.field label { display:block; font-size:12px; color:var(--muted); font-family:var(--mono); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.field input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px 16px; color:var(--text); font-family:var(--sans); font-size:15px; outline:none; transition:border-color .2s; }
.field input:focus { border-color:var(--accent2); }
.btn { width:100%; padding:14px; border:none; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; font-family:var(--sans); transition:all .2s; }
.btn-primary { background:var(--accent); color:#000; }
.btn-primary:hover { background:#00c853; }
.btn-secondary { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
.btn-danger { background:transparent; color:var(--danger); border:1px solid var(--danger); }
.btn-sm { padding:8px 16px; font-size:13px; width:auto; border-radius:8px; }

/* App Layout */
.app { display:none; flex-direction:column; min-height:100vh; }
.app.visible { display:flex; }
.topbar { background:var(--surface); border-bottom:1px solid var(--border); padding:16px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
.topbar-logo { font-family:var(--mono); font-size:18px; color:var(--accent); letter-spacing:-1px; }
.topbar-user { font-size:13px; color:var(--muted); }
.nav { background:var(--surface); border-bottom:1px solid var(--border); display:flex; overflow-x:auto; padding:0 8px; gap:4px; }
.nav::-webkit-scrollbar { display:none; }
.nav-btn { padding:12px 16px; font-size:13px; font-weight:500; color:var(--muted); background:none; border:none; cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; transition:all .2s; font-family:var(--sans); }
.nav-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
.content { flex:1; padding:20px; max-width:800px; width:100%; margin:0 auto; }

/* Cards */
.card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px; margin-bottom:16px; }
.card-title { font-size:11px; font-family:var(--mono); color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.balance-big { font-size:40px; font-weight:700; font-family:var(--mono); color:var(--accent); line-height:1; }
.balance-unit { font-size:14px; color:var(--muted); margin-top:4px; }
.stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
.stat { background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:center; }
.stat-val { font-size:24px; font-weight:700; font-family:var(--mono); }
.stat-label { font-size:11px; color:var(--muted); margin-top:4px; }

/* Invoice list */
.inv-item { background:var(--surface2); border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition:border-color .2s; }
.inv-item:hover { border-color:var(--accent2); }
.inv-desc { font-size:14px; font-weight:500; }
.inv-meta { font-size:11px; color:var(--muted); margin-top:3px; font-family:var(--mono); }
.inv-amount { font-size:16px; font-weight:700; font-family:var(--mono); text-align:right; }
.badge { display:inline-block; padding:3px 10px; border-radius:6px; font-size:10px; font-weight:700; font-family:var(--mono); margin-top:4px; }
.badge-paid { background:#003322; color:var(--accent); }
.badge-pending { background:#1a1600; color:var(--warn); }
.badge-expired { background:#1a0000; color:var(--danger); }
.badge-open { background:#1a0000; color:var(--danger); }

/* Forms */
.form-group { margin-bottom:20px; }
.form-group label { display:block; font-size:12px; color:var(--muted); font-family:var(--mono); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.form-group input, .form-group select, .form-group textarea { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px 16px; color:var(--text); font-family:var(--sans); font-size:15px; outline:none; transition:border-color .2s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color:var(--accent2); }
.form-group textarea { resize:vertical; min-height:80px; }
.form-group select option { background:var(--surface); }

/* Modal */
.modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.8); z-index:200; align-items:center; justify-content:center; padding:20px; }
.modal-overlay.open { display:flex; }
.modal { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:28px; width:100%; max-width:460px; max-height:90vh; overflow-y:auto; }
.modal-title { font-size:18px; font-weight:600; margin-bottom:20px; }
.modal-close { float:right; background:none; border:none; color:var(--muted); font-size:22px; cursor:pointer; }

/* API Key */
.apikey-box { background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:16px; font-family:var(--mono); font-size:13px; word-break:break-all; color:var(--accent); margin:12px 0; }
.copy-btn { background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:8px 14px; border-radius:8px; font-size:12px; cursor:pointer; font-family:var(--mono); }
.copy-btn:hover { border-color:var(--accent); color:var(--accent); }

/* Payment link */
.link-box { background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:14px; font-family:var(--mono); font-size:12px; word-break:break-all; color:var(--accent2); margin:12px 0; }

/* Alert */
.alert { padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:16px; }
.alert-success { background:#003322; border:1px solid var(--accent); color:var(--accent); }
.alert-error { background:#1a0000; border:1px solid var(--danger); color:var(--danger); }
.alert-info { background:#0a0a2a; border:1px solid var(--accent2); color:var(--accent2); }

/* Loading */
.spinner { width:40px; height:40px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite; margin:40px auto; }
@keyframes spin { to { transform:rotate(360deg); } }
.loading-text { text-align:center; color:var(--muted); padding:40px; }

/* Withdraw form */
.fee-breakdown { background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:16px; margin:12px 0; }
.fee-row { display:flex; justify-content:space-between; font-size:13px; padding:4px 0; }
.fee-row.total { border-top:1px solid var(--border); margin-top:8px; padding-top:12px; font-weight:700; color:var(--accent); }

/* Responsive */
@media(max-width:480px) {
  .stats-grid { grid-template-columns:1fr 1fr; }
  .content { padding:12px; }
  .balance-big { font-size:32px; }
}

/* QR */
.qr-box { background:white; border-radius:12px; padding:16px; display:inline-block; margin:16px 0; }
.qr-box img { width:180px; height:180px; display:block; }
</style>
</head>
<body>

<!-- AUTH SCREEN (for browser access) -->
<div class="auth-screen" id="authScreen">
  <div class="auth-logo">VERTEXT</div>
  <div class="auth-sub">Crypto Escrow & Invoicing Platform</div>
  <div class="auth-card">
    <div class="auth-title">Merchant Login</div>
    <div class="auth-desc">Enter your Telegram ID and API key to access your dashboard. Generate your API key with /apikey in the bot.</div>
    <div id="authAlert"></div>
    <div class="field">
      <label>Telegram ID</label>
      <input type="number" id="loginTgId" placeholder="e.g. 123456789">
    </div>
    <div class="field">
      <label>API Key</label>
      <input type="text" id="loginApiKey" placeholder="vxt_...">
    </div>
    <button class="btn btn-primary" onclick="login()">Access Dashboard</button>
    <div style="margin-top:16px;text-align:center;font-size:12px;color:var(--muted)">
      <a href="/terms" style="color:var(--muted)">Terms</a> · 
      <a href="/privacy" style="color:var(--muted)">Privacy</a> · 
      <a href="/api-docs" style="color:var(--muted)">API Docs</a>
    </div>
  </div>
</div>

<!-- MAIN APP -->
<div class="app" id="app">
  <div class="topbar">
    <div class="topbar-logo">VERTEXT</div>
    <div style="display:flex;align-items:center;gap:12px">
      <span class="topbar-user" id="topbarUser"></span>
      <button class="btn btn-sm btn-secondary" onclick="logout()">Logout</button>
    </div>
  </div>
  <nav class="nav">
    <button class="nav-btn active" onclick="showTab('overview')">Overview</button>
    <button class="nav-btn" onclick="showTab('invoices')">Invoices</button>
    <button class="nav-btn" onclick="showTab('create')">Create Invoice</button>
    <button class="nav-btn" onclick="showTab('wallet')">Wallet</button>
    <button class="nav-btn" onclick="showTab('api')">API Settings</button>
  </nav>
  <div class="content">
    <div id="alertBox"></div>

    <!-- OVERVIEW TAB -->
    <div id="tab-overview">
      <div class="card">
        <div class="card-title">Available Balance</div>
        <div class="balance-big" id="balanceAmount">$0.0000</div>
        <div class="balance-unit" id="balanceUnit">USDT · TRC20</div>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="showTab('wallet')">Withdraw</button>
          <button class="btn btn-secondary btn-sm" onclick="showTab('create')">New Invoice</button>
        </div>
      </div>
      <div class="stats-grid" id="statsGrid">
        <div class="stat"><div class="stat-val" id="statTotal">0</div><div class="stat-label">Invoices</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--accent)" id="statPaid">0</div><div class="stat-label">Paid</div></div>
        <div class="stat"><div class="stat-val" style="color:var(--warn)" id="statPending">0</div><div class="stat-label">Pending</div></div>
      </div>
      <div class="card-title" style="margin-bottom:12px">Recent Invoices</div>
      <div id="recentInvoices"><div class="loading-text">Loading...</div></div>
    </div>

    <!-- INVOICES TAB -->
    <div id="tab-invoices" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-size:20px;font-weight:700">My Invoices</h2>
        <button class="btn btn-primary btn-sm" onclick="showTab('create')">+ New</button>
      </div>
      <div id="invoicesList"><div class="loading-text">Loading...</div></div>
    </div>

    <!-- CREATE INVOICE TAB -->
    <div id="tab-create" style="display:none">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">Create Invoice</h2>
      <div class="card">
        <div id="createAlert"></div>
        <div class="form-group">
          <label>Amount (USD)</label>
          <input type="number" id="invAmount" placeholder="50.00" min="1" step="0.01">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="invDesc" placeholder="e.g. Website design deposit"></textarea>
        </div>
        <button class="btn btn-primary" onclick="createInvoice()">Generate Invoice Link</button>
      </div>
      <div id="invoiceResult" style="display:none">
        <div class="card">
          <div class="card-title">Invoice Created</div>
          <div class="link-box" id="invoiceLinkBox"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="copy-btn" onclick="copyInvoiceLink()">Copy Link</button>
            <button class="copy-btn" onclick="openInvoiceLink()">Open Link</button>
          </div>
        </div>
      </div>
    </div>

    <!-- WALLET TAB -->
    <div id="tab-wallet" style="display:none">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">My Wallet</h2>
      <div class="card">
        <div class="card-title">Balance</div>
        <div class="balance-big" id="walletBalance">$0.0000</div>
        <div class="balance-unit" id="walletUnit">USDT</div>
        <div style="margin-top:12px;font-size:13px;color:var(--muted)">
          Payout Address: <span style="font-family:var(--mono);color:var(--text);font-size:12px" id="walletAddress">—</span>
        </div>
        <div style="margin-top:4px;font-size:13px;color:var(--muted)">
          Locked in disputes: <span style="color:var(--danger);font-family:var(--mono)" id="lockedAmount">$0.0000</span>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Withdraw Funds</div>
        <div id="withdrawAlert"></div>
        <div class="form-group">
          <label>Amount to Withdraw (USD)</label>
          <input type="number" id="wdAmount" placeholder="e.g. 45.00" min="0.01" step="0.01">
        </div>
        <div class="fee-breakdown" id="feeBreakdown" style="display:none">
          <div class="fee-row"><span>Requested Amount</span><span id="feeGross">—</span></div>
          <div class="fee-row"><span>Network Fee</span><span id="feeNetwork">~$1.00</span></div>
          <div class="fee-row"><span>Platform Fee</span><span id="feePlatform">$1.00</span></div>
          <div class="fee-row total"><span>You Receive</span><span id="feeNet">—</span></div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="calcFees()" style="flex:1">Calculate Fees</button>
          <button class="btn btn-primary btn-sm" onclick="requestWithdraw()" style="flex:1" id="wdBtn" disabled>Withdraw</button>
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--muted)">
          Withdrawals are processed via the bot. You will receive a confirmation message on Telegram.
        </div>
      </div>
      <div class="card">
        <div class="card-title">Recent Withdrawals</div>
        <div id="wdList"><div class="loading-text">Loading...</div></div>
      </div>
    </div>

    <!-- API SETTINGS TAB -->
    <div id="tab-api" style="display:none">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:20px">API Settings</h2>
      <div class="card">
        <div class="card-title">Your API Key</div>
        <div id="apiKeyDisplay"><div class="loading-text">Loading...</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="generateApiKey()">Generate New Key</button>
          <button class="copy-btn" onclick="copyApiKey()" id="copyKeyBtn" style="display:none">Copy Key</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Webhook URL</div>
        <div id="webhookDisplay" style="font-size:13px;color:var(--muted);margin-bottom:12px">Not configured</div>
        <div class="form-group">
          <label>Set Webhook URL (HTTPS only)</label>
          <input type="url" id="webhookUrl" placeholder="https://yoursite.com/webhook">
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="saveWebhook()">Save Webhook</button>
          <button class="btn btn-danger btn-sm" onclick="removeWebhook()">Remove</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">API Documentation</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:12px">Build integrations using the Vertext REST API.</div>
        <a href="/api-docs" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-block;text-decoration:none;text-align:center">View API Docs →</a>
      </div>
    </div>
  </div>
</div>

<!-- Invoice Detail Modal -->
<div class="modal-overlay" id="invoiceModal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">×</button>
    <div class="modal-title">Invoice Details</div>
    <div id="modalContent"></div>
  </div>
</div>

<script>
const tg = window.Telegram?.WebApp;
let SESSION = { userId: null, apiKey: null, merchant: null };
let currentInvoiceLink = '';
let currentApiKey = '';

// ── Init ────────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  if (tg) { tg.ready(); tg.expand(); }

  // Check Telegram Mini App
  const tgUser = tg?.initDataUnsafe?.user;
  if (tgUser?.id) {
    // Auto-login with Telegram ID (no API key needed in Mini App)
    SESSION.userId = tgUser.id;
    SESSION.apiKey = 'tg_auth';
    try {
      const res = await fetch('/api/dashboard?user_id=' + tgUser.id);
      if (res.ok) {
        const data = await res.json();
        SESSION.merchant = data.merchant;
        showApp(tgUser.first_name || 'Merchant', data);
        return;
      }
    } catch {}
  }

  // Check saved session
  const saved = localStorage.getItem('vxt_session');
  if (saved) {
    try {
      SESSION = JSON.parse(saved);
      const res = await fetch('/api/dashboard?user_id=' + SESSION.userId + '&api_key=' + SESSION.apiKey);
      if (res.ok) {
        const data = await res.json();
        SESSION.merchant = data.merchant;
        showApp('Merchant #' + SESSION.userId, data);
        return;
      }
    } catch {}
    localStorage.removeItem('vxt_session');
  }

  document.getElementById('authScreen').style.display = 'flex';
});

async function login() {
  const tgId = document.getElementById('loginTgId').value.trim();
  const apiKey = document.getElementById('loginApiKey').value.trim();
  if (!tgId || !apiKey) { showAuthAlert('Please enter both fields.', 'error'); return; }

  try {
    const res = await fetch('/api/dashboard?user_id=' + tgId + '&api_key=' + apiKey);
    if (!res.ok) { showAuthAlert('Invalid credentials. Check your Telegram ID and API key.', 'error'); return; }
    const data = await res.json();
    SESSION = { userId: parseInt(tgId), apiKey, merchant: data.merchant };
    localStorage.setItem('vxt_session', JSON.stringify({ userId: SESSION.userId, apiKey: SESSION.apiKey }));
    showApp('Merchant #' + tgId, data);
  } catch (e) { showAuthAlert('Login failed: ' + e.message, 'error'); }
}

function logout() {
  localStorage.removeItem('vxt_session');
  SESSION = { userId: null, apiKey: null, merchant: null };
  document.getElementById('app').classList.remove('visible');
  document.getElementById('authScreen').style.display = 'flex';
}

function showAuthAlert(msg, type) {
  document.getElementById('authAlert').innerHTML = '<div class="alert alert-' + (type==='error'?'error':'success') + '">' + msg + '</div>';
}

// ── App Init ─────────────────────────────────────────────────────────────────
function showApp(name, data) {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('topbarUser').textContent = name;
  renderOverview(data);
  loadWallet();
  loadApiSettings();
}

// ── Tab Navigation ────────────────────────────────────────────────────────────
function showTab(tab) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tab).style.display = 'block';
  const tabs = ['overview','invoices','create','wallet','api'];
  const idx = tabs.indexOf(tab);
  document.querySelectorAll('.nav-btn')[idx]?.classList.add('active');
  if (tab === 'invoices') loadInvoices();
  if (tab === 'wallet') loadWallet();
  if (tab === 'api') loadApiSettings();
}

// ── Overview ──────────────────────────────────────────────────────────────────
function renderOverview(data) {
  const m = data.merchant;
  const inv = data.invoices || [];
  const paid = inv.filter(i => i.status === 'PAID').length;
  const pending = inv.filter(i => i.status === 'PENDING').length;
  document.getElementById('balanceAmount').textContent = '$' + Number(m.internal_balance).toFixed(4);
  document.getElementById('balanceUnit').textContent = 'USDT · ' + m.payout_network;
  document.getElementById('statTotal').textContent = inv.length;
  document.getElementById('statPaid').textContent = paid;
  document.getElementById('statPending').textContent = pending;
  renderInvoiceList(inv.slice(0, 5), 'recentInvoices');
}

// ── Invoices ──────────────────────────────────────────────────────────────────
async function loadInvoices() {
  document.getElementById('invoicesList').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await fetch('/api/dashboard?user_id=' + SESSION.userId + '&api_key=' + SESSION.apiKey);
    const data = await res.json();
    renderInvoiceList(data.invoices || [], 'invoicesList');
  } catch { document.getElementById('invoicesList').innerHTML = '<div class="loading-text">Failed to load invoices.</div>'; }
}

function renderInvoiceList(invoices, containerId) {
  const el = document.getElementById(containerId);
  if (!invoices.length) { el.innerHTML = '<div class="loading-text">No invoices yet.</div>'; return; }
  el.innerHTML = invoices.map(inv => {
    const status = inv.status === 'PAID' ? 'paid' : inv.status === 'EXPIRED' ? 'expired' : 'pending';
    const dispute = inv.dispute_status === 'OPEN' ? '<span class="badge badge-open">DISPUTE</span>' : '';
    return '<div class="inv-item" onclick="showInvoiceDetail(' + "'" + inv.invoice_id + "'" + ')">' +
      '<div><div class="inv-desc">' + inv.description.slice(0,40) + '</div>' +
      '<div class="inv-meta">' + new Date(inv.created_at).toLocaleDateString() + ' · ' + inv.invoice_id.slice(0,8) + '...</div></div>' +
      '<div style="text-align:right"><div class="inv-amount">$' + Number(inv.amount_fiat).toFixed(2) + '</div>' +
      '<span class="badge badge-' + status + '">' + inv.status + '</span>' + dispute + '</div></div>';
  }).join('');
}

function showInvoiceDetail(invoiceId) {
  const botUser = window.location.hostname.includes('render') ? 'Vertextmarketbot' : 'Vertextmarketbot';
  const link = 'https://t.me/' + botUser + '?start=inv_' + invoiceId;
  document.getElementById('modalContent').innerHTML =
    '<div class="form-group"><label>Invoice ID</label><div class="apikey-box" style="font-size:11px">' + invoiceId + '</div></div>' +
    '<div class="form-group"><label>Payment Link</label><div class="link-box">' + link + '</div></div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="copy-btn" onclick="navigator.clipboard.writeText(\'' + link + '\')">Copy Link</button>' +
    '<a href="' + link + '" target="_blank" class="copy-btn" style="text-decoration:none">Open Link</a></div>';
  document.getElementById('invoiceModal').classList.add('open');
}

function closeModal() { document.getElementById('invoiceModal').classList.remove('open'); }

// ── Create Invoice ────────────────────────────────────────────────────────────
async function createInvoice() {
  const amount = parseFloat(document.getElementById('invAmount').value);
  const desc = document.getElementById('invDesc').value.trim();
  const alertEl = document.getElementById('createAlert');
  if (!amount || amount < 1) { alertEl.innerHTML = '<div class="alert alert-error">Minimum amount is $1.00</div>'; return; }
  if (!desc) { alertEl.innerHTML = '<div class="alert alert-error">Please enter a description.</div>'; return; }
  alertEl.innerHTML = '<div class="alert alert-info">Creating invoice...</div>';
  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': SESSION.userId, 'X-Api-Key': SESSION.apiKey },
      body: JSON.stringify({ amount, description: desc }),
    });
    const data = await res.json();
    if (!res.ok) { alertEl.innerHTML = '<div class="alert alert-error">' + (data.error || 'Failed') + '</div>'; return; }
    alertEl.innerHTML = '<div class="alert alert-success">Invoice created successfully!</div>';
    currentInvoiceLink = data.link;
    document.getElementById('invoiceLinkBox').textContent = data.link;
    document.getElementById('invoiceResult').style.display = 'block';
  } catch (e) { alertEl.innerHTML = '<div class="alert alert-error">Error: ' + e.message + '</div>'; }
}

function copyInvoiceLink() { navigator.clipboard.writeText(currentInvoiceLink); showAlert('Link copied!', 'success'); }
function openInvoiceLink() { window.open(currentInvoiceLink, '_blank'); }

// ── Wallet ────────────────────────────────────────────────────────────────────
async function loadWallet() {
  try {
    const res = await fetch('/api/dashboard?user_id=' + SESSION.userId + '&api_key=' + SESSION.apiKey);
    const data = await res.json();
    const m = data.merchant;
    document.getElementById('walletBalance').textContent = '$' + Number(m.internal_balance).toFixed(4);
    document.getElementById('walletUnit').textContent = 'USDT on ' + m.payout_network;
    document.getElementById('walletAddress').textContent = m.payout_address || '—';
    document.getElementById('lockedAmount').textContent = '$' + Number(m.locked_amount || 0).toFixed(4);
    const wdRes = await fetch('/api/withdrawals?user_id=' + SESSION.userId + '&api_key=' + SESSION.apiKey);
    const wdData = await wdRes.json();
    const wds = wdData.withdrawals || [];
    document.getElementById('wdList').innerHTML = wds.length ? wds.slice(0,10).map(w =>
      '<div class="inv-item"><div><div class="inv-desc">Withdrawal</div><div class="inv-meta">' + new Date(w.created_at).toLocaleDateString() + '</div></div>' +
      '<div style="text-align:right"><div class="inv-amount">$' + Number(w.net_payout).toFixed(4) + '</div>' +
      '<span class="badge badge-' + (w.status==='COMPLETED'?'paid':'pending') + '">' + w.status + '</span></div></div>'
    ).join('') : '<div class="loading-text">No withdrawals yet.</div>';
  } catch {}
}

function calcFees() {
  const amount = parseFloat(document.getElementById('wdAmount').value);
  if (!amount || amount <= 0) { document.getElementById('withdrawAlert').innerHTML = '<div class="alert alert-error">Enter a valid amount.</div>'; return; }
  const networkFee = 1.0;
  const platformFee = 1.0;
  const net = amount - networkFee - platformFee;
  if (net <= 0) { document.getElementById('withdrawAlert').innerHTML = '<div class="alert alert-error">Amount too small to cover fees. Min: $' + (networkFee + platformFee + 0.01).toFixed(2) + '</div>'; return; }
  document.getElementById('feeGross').textContent = '$' + amount.toFixed(4);
  document.getElementById('feeNetwork').textContent = '~$' + networkFee.toFixed(4);
  document.getElementById('feePlatform').textContent = '$' + platformFee.toFixed(2);
  document.getElementById('feeNet').textContent = '$' + net.toFixed(4) + ' USDT';
  document.getElementById('feeBreakdown').style.display = 'block';
  document.getElementById('wdBtn').disabled = false;
  document.getElementById('withdrawAlert').innerHTML = '';
}

async function requestWithdraw() {
  const amount = parseFloat(document.getElementById('wdAmount').value);
  if (!amount) return;
  document.getElementById('withdrawAlert').innerHTML = '<div class="alert alert-info">Withdrawal request sent to bot. Check your Telegram for confirmation.</div>';
  document.getElementById('wdBtn').disabled = true;
  try {
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': SESSION.userId, 'X-Api-Key': SESSION.apiKey },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('withdrawAlert').innerHTML = '<div class="alert alert-error">' + (data.error || 'Failed') + '</div>'; document.getElementById('wdBtn').disabled = false; }
  } catch (e) { document.getElementById('withdrawAlert').innerHTML = '<div class="alert alert-error">' + e.message + '</div>'; document.getElementById('wdBtn').disabled = false; }
}

// ── API Settings ──────────────────────────────────────────────────────────────
async function loadApiSettings() {
  try {
    const res = await fetch('/api/dashboard?user_id=' + SESSION.userId + '&api_key=' + SESSION.apiKey);
    const data = await res.json();
    const m = data.merchant;
    currentApiKey = m.api_key || '';
    if (m.api_key) {
      document.getElementById('apiKeyDisplay').innerHTML = '<div class="apikey-box">' + m.api_key + '</div><div style="font-size:12px;color:var(--muted)">Keep this secret. Use it to verify webhook signatures.</div>';
      document.getElementById('copyKeyBtn').style.display = 'inline-block';
    } else {
      document.getElementById('apiKeyDisplay').innerHTML = '<div style="color:var(--muted);font-size:13px">No API key generated yet. Click below to generate one.</div>';
    }
    document.getElementById('webhookDisplay').textContent = m.webhook_url || 'Not configured';
    if (m.webhook_url) document.getElementById('webhookUrl').value = m.webhook_url;
  } catch {}
}

async function generateApiKey() {
  try {
    const res = await fetch('/api/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': SESSION.userId, 'X-Api-Key': SESSION.apiKey || 'none' },
    });
    const data = await res.json();
    if (!res.ok) { showAlert(data.error || 'Failed to generate key', 'error'); return; }
    currentApiKey = data.api_key;
    document.getElementById('apiKeyDisplay').innerHTML = '<div class="apikey-box">' + data.api_key + '</div><div style="font-size:12px;color:var(--muted)">Save this key — it is used to authenticate API requests and verify webhooks.</div>';
    document.getElementById('copyKeyBtn').style.display = 'inline-block';
    showAlert('API key generated successfully!', 'success');
    // Update session with new key
    SESSION.apiKey = data.api_key;
    localStorage.setItem('vxt_session', JSON.stringify({ userId: SESSION.userId, apiKey: SESSION.apiKey }));
  } catch (e) { showAlert('Error: ' + e.message, 'error'); }
}

function copyApiKey() { navigator.clipboard.writeText(currentApiKey); showAlert('API key copied!', 'success'); }

async function saveWebhook() {
  const url = document.getElementById('webhookUrl').value.trim();
  if (!url.startsWith('https://')) { showAlert('Webhook URL must use HTTPS', 'error'); return; }
  try {
    const res = await fetch('/api/webhook-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Merchant-Id': SESSION.userId, 'X-Api-Key': SESSION.apiKey },
      body: JSON.stringify({ webhook_url: url }),
    });
    const data = await res.json();
    if (!res.ok) { showAlert(data.error || 'Failed', 'error'); return; }
    document.getElementById('webhookDisplay').textContent = url;
    showAlert('Webhook URL saved!', 'success');
  } catch (e) { showAlert('Error: ' + e.message, 'error'); }
}

async function removeWebhook() {
  try {
    await fetch('/api/webhook-url', {
      method: 'DELETE',
      headers: { 'X-Merchant-Id': SESSION.userId, 'X-Api-Key': SESSION.apiKey },
    });
    document.getElementById('webhookDisplay').textContent = 'Not configured';
    document.getElementById('webhookUrl').value = '';
    showAlert('Webhook removed.', 'success');
  } catch {}
}

function showAlert(msg, type) {
  const el = document.getElementById('alertBox');
  el.innerHTML = '<div class="alert alert-' + (type==='error'?'error':'success') + '">' + msg + '</div>';
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// Close modal on overlay click
document.getElementById('invoiceModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
</script>
</body>
</html>`;
}
