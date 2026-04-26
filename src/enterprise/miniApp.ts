export const MINI_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Vertext Dashboard</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--tg-theme-bg-color,#0f0f1a);color:var(--tg-theme-text-color,#fff);min-height:100vh;padding:16px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.header h1{font-size:20px;font-weight:700}
.badge{background:#0f9b58;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
.balance-card{background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #2d3748;border-radius:16px;padding:20px;margin-bottom:20px}
.balance-label{color:#a0aec0;font-size:12px;text-transform:uppercase;letter-spacing:1px}
.balance-amount{font-size:36px;font-weight:800;color:#68d391;margin:8px 0 4px}
.balance-sub{color:#718096;font-size:13px}
.stats-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px}
.stat-card{background:#1a202c;border:1px solid #2d3748;border-radius:12px;padding:12px;text-align:center}
.stat-value{font-size:20px;font-weight:700}
.stat-label{color:#a0aec0;font-size:10px;margin-top:4px}
.section-title{font-size:14px;font-weight:600;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.invoice-list{display:flex;flex-direction:column;gap:8px}
.invoice-item{background:#1a202c;border:1px solid #2d3748;border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center}
.invoice-desc{font-size:13px;font-weight:500;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.invoice-meta{font-size:11px;color:#718096;margin-top:3px}
.invoice-amount{font-size:15px;font-weight:700}
.badge-paid{background:#1c4532;color:#68d391;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600}
.badge-pending{background:#2d3748;color:#ecc94b;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600}
.badge-expired{background:#2d3748;color:#fc8181;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:600}
.loading{text-align:center;color:#718096;padding:40px}
.error{text-align:center;color:#fc8181;padding:20px}
.btn{width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;background:#2d3748;color:#e2e8f0}
</style>
</head>
<body>
<div class="header"><h1>Vertext</h1><span class="badge">MERCHANT</span></div>
<div id="app"><div class="loading">Loading dashboard...</div></div>
<script>
const tg=window.Telegram.WebApp;
tg.ready();tg.expand();
async function loadDashboard(){
  const userId=tg.initDataUnsafe?.user?.id;
  if(!userId){document.getElementById('app').innerHTML='<div class="error">Open via Telegram bot.</div>';return;}
  try{
    const res=await fetch(window.location.origin+'/api/dashboard?user_id='+userId+'&init_data='+encodeURIComponent(tg.initData));
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data=await res.json();
    renderDashboard(data);
  }catch(err){document.getElementById('app').innerHTML='<div class="error">Failed to load: '+err.message+'</div>';}
}
function renderDashboard(data){
  const{merchant,invoices}=data;
  const paid=invoices.filter(i=>i.status==='PAID').length;
  const disputes=invoices.filter(i=>i.dispute_status==='OPEN').length;
  document.getElementById('app').innerHTML=\`
    <div class="balance-card">
      <div class="balance-label">Available Balance</div>
      <div class="balance-amount">\$\${Number(merchant.internal_balance).toFixed(4)}</div>
      <div class="balance-sub">USDT on \${merchant.payout_network}</div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">\${invoices.length}</div><div class="stat-label">Invoices</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#68d391">\${paid}</div><div class="stat-label">Paid</div></div>
      <div class="stat-card"><div class="stat-value" style="color:\${disputes>0?'#fc8181':'#68d391'}">\${disputes}</div><div class="stat-label">Disputes</div></div>
    </div>
    <div class="section-title">Recent Invoices</div>
    <div class="invoice-list">
      \${invoices.slice(0,20).map(inv=>\`
        <div class="invoice-item">
          <div><div class="invoice-desc">\${inv.description}</div><div class="invoice-meta">\${new Date(inv.created_at).toLocaleDateString()}</div></div>
          <div style="text-align:right"><div class="invoice-amount">\$\${Number(inv.amount_fiat).toFixed(2)}</div>
          <div style="margin-top:4px">\${inv.status==='PAID'?'<span class=badge-paid>PAID</span>':inv.status==='EXPIRED'?'<span class=badge-expired>EXPIRED</span>':'<span class=badge-pending>PENDING</span>'}</div></div>
        </div>\`).join('')}
    </div>
    <button class="btn" onclick="tg.close()" style="margin-top:20px">Close Dashboard</button>
  \`;
}
loadDashboard();
</script>
</body>
</html>`;
