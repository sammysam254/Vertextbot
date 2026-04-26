export function getApiDocsHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>API Documentation — Vertext</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#080810;color:#e8e8f0;line-height:1.7}
.header{background:#0f0f1c;border-bottom:1px solid #1e1e35;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.logo{font-family:'Space Mono',monospace;font-size:20px;color:#ffab40;text-decoration:none;letter-spacing:-1px}
.nav-links a{color:#6b6b8a;text-decoration:none;font-size:13px;margin-left:20px}
.nav-links a:hover{color:#ffab40}
.layout{display:flex;min-height:100vh}
.sidebar{width:240px;background:#0f0f1c;border-right:1px solid #1e1e35;padding:24px 0;position:sticky;top:57px;height:calc(100vh - 57px);overflow-y:auto;flex-shrink:0}
.sidebar::-webkit-scrollbar{width:4px}
.sidebar::-webkit-scrollbar-thumb{background:#1e1e35;border-radius:2px}
.sidebar-section{padding:8px 20px;font-size:10px;font-family:'Space Mono',monospace;color:#6b6b8a;text-transform:uppercase;letter-spacing:2px;margin-top:16px}
.sidebar-link{display:block;padding:8px 20px;font-size:13px;color:#a0a0b8;text-decoration:none;transition:all .15s;border-left:2px solid transparent}
.sidebar-link:hover,.sidebar-link.active{color:#ffab40;border-left-color:#ffab40;background:rgba(255,171,64,.05)}
.main{flex:1;padding:40px;max-width:860px}
h1{font-size:40px;font-weight:700;font-family:'Space Mono',monospace;color:#ffab40;margin-bottom:8px}
.tagline{color:#6b6b8a;font-size:16px;margin-bottom:40px}
h2{font-size:24px;font-weight:700;margin:48px 0 16px;padding-top:48px;border-top:1px solid #1e1e35;scroll-margin-top:80px}
h3{font-size:16px;font-weight:600;margin:24px 0 10px;color:#e8e8f0}
p{color:#a0a0b8;margin-bottom:14px;font-size:15px}
.base-url{background:#0f0f1c;border:1px solid #1e1e35;border-radius:10px;padding:16px 20px;font-family:'Space Mono',monospace;font-size:13px;color:#ffab40;margin-bottom:24px}
.endpoint{background:#0f0f1c;border:1px solid #1e1e35;border-radius:12px;margin-bottom:24px;overflow:hidden}
.endpoint-header{padding:16px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #1e1e35}
.method{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px}
.method.get{background:#003322;color:#00e676}
.method.post{background:#001a3a;color:#448aff}
.method.delete{background:#1a0000;color:#ff5252}
.path{font-family:'Space Mono',monospace;font-size:14px;color:#e8e8f0}
.endpoint-body{padding:20px}
.endpoint-desc{color:#a0a0b8;font-size:14px;margin-bottom:16px}
.params-title{font-size:11px;font-family:'Space Mono',monospace;color:#6b6b8a;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
th{background:#080810;padding:10px 14px;text-align:left;color:#6b6b8a;font-weight:600;border:1px solid #1e1e35;font-family:'Space Mono',monospace;font-size:11px}
td{padding:10px 14px;border:1px solid #1e1e35;color:#a0a0b8;vertical-align:top}
.required{color:#ff5252;font-size:10px;font-family:'Space Mono',monospace}
.optional{color:#6b6b8a;font-size:10px;font-family:'Space Mono',monospace}
pre{background:#080810;border:1px solid #1e1e35;border-radius:10px;padding:16px 20px;font-family:'Space Mono',monospace;font-size:12px;overflow-x:auto;line-height:1.8;margin:10px 0}
.key{color:#7c4dff}.str{color:#00e676}.num{color:#ffab40}.bool{color:#ff5252}.comment{color:#6b6b8a}
.badge-auth{background:#001a3a;color:#448aff;padding:4px 10px;border-radius:6px;font-size:11px;font-family:'Space Mono',monospace}
.alert{padding:14px 18px;border-radius:10px;font-size:14px;margin:16px 0}
.alert-info{background:#001a3a;border:1px solid #1e1e35;color:#a0c4ff}
.alert-warn{background:#1a1000;border:1px solid #ffab40;color:#ffab40}
.code{font-family:'Space Mono',monospace;background:#0f0f1c;padding:2px 8px;border-radius:4px;font-size:12px;color:#ffab40}
.footer{background:#0f0f1c;border-top:1px solid #1e1e35;padding:24px;text-align:center;color:#6b6b8a;font-size:13px;margin-top:60px}
.footer a{color:#6b6b8a;text-decoration:none;margin:0 12px}
@media(max-width:768px){.sidebar{display:none}.main{padding:20px}}
</style>
</head>
<body>
<div class="header">
  <a href="/dashboard" class="logo">VERTEXT</a>
  <div class="nav-links">
    <a href="/dashboard">Dashboard</a>
    <a href="/terms">Terms</a>
    <a href="/privacy">Privacy</a>
  </div>
</div>
<div class="layout">
  <div class="sidebar">
    <div class="sidebar-section">Getting Started</div>
    <a href="#intro" class="sidebar-link active">Introduction</a>
    <a href="#auth" class="sidebar-link">Authentication</a>
    <a href="#errors" class="sidebar-link">Error Codes</a>
    <div class="sidebar-section">Endpoints</div>
    <a href="#dashboard" class="sidebar-link">GET /dashboard</a>
    <a href="#invoices-create" class="sidebar-link">POST /invoices</a>
    <a href="#withdraw" class="sidebar-link">POST /withdraw</a>
    <a href="#withdrawals" class="sidebar-link">GET /withdrawals</a>
    <a href="#apikey" class="sidebar-link">POST /apikey</a>
    <a href="#webhook-url" class="sidebar-link">POST /webhook-url</a>
    <a href="#webhook-url-del" class="sidebar-link">DELETE /webhook-url</a>
    <div class="sidebar-section">Webhooks</div>
    <a href="#webhook-events" class="sidebar-link">Payment Events</a>
    <a href="#webhook-verify" class="sidebar-link">Verification</a>
    <div class="sidebar-section">Examples</div>
    <a href="#example-node" class="sidebar-link">Node.js</a>
    <a href="#example-python" class="sidebar-link">Python</a>
  </div>
  <div class="main">
    <h1>API Docs</h1>
    <p class="tagline">Build integrations with the Vertext Escrow & Invoicing API</p>

    <div class="base-url">Base URL: https://vertextbot.onrender.com/api</div>

    <!-- INTRO -->
    <h2 id="intro">Introduction</h2>
    <p>The Vertext REST API allows you to programmatically create invoices, check balances, trigger withdrawals, and receive real-time payment notifications via webhooks. All responses are JSON.</p>
    <div class="alert alert-info">
      All API endpoints require authentication via your Merchant ID and API Key. Generate your API key using the <span class="code">/apikey</span> command in the bot or via the Dashboard.
    </div>

    <!-- AUTH -->
    <h2 id="auth">Authentication</h2>
    <p>Pass your credentials in request headers:</p>
    <pre><span class="key">X-Merchant-Id</span>: <span class="num">123456789</span>       <span class="comment"># Your Telegram user ID</span>
<span class="key">X-Api-Key</span>: <span class="str">vxt_abc123...</span>          <span class="comment"># Your Vertext API key</span></pre>
    <p>For GET requests, you may also pass them as query parameters:</p>
    <pre>GET /api/dashboard?<span class="key">user_id</span>=<span class="num">123456789</span>&<span class="key">api_key</span>=<span class="str">vxt_abc123...</span></pre>
    <div class="alert alert-warn">Keep your API key secret. Anyone with your key can access your merchant data and trigger withdrawals.</div>

    <!-- ERRORS -->
    <h2 id="errors">Error Codes</h2>
    <table>
      <tr><th>HTTP Code</th><th>Meaning</th></tr>
      <tr><td>200</td><td>Success</td></tr>
      <tr><td>400</td><td>Bad Request — missing or invalid parameters</td></tr>
      <tr><td>401</td><td>Unauthorized — invalid or missing credentials</td></tr>
      <tr><td>404</td><td>Not Found — merchant or resource doesn't exist</td></tr>
      <tr><td>422</td><td>Unprocessable — business logic error (e.g. insufficient balance)</td></tr>
      <tr><td>500</td><td>Internal Server Error</td></tr>
    </table>
    <p>Error responses follow this format:</p>
    <pre>{ <span class="key">"error"</span>: <span class="str">"Insufficient balance"</span> }</pre>

    <!-- DASHBOARD -->
    <h2 id="dashboard">GET /api/dashboard</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/dashboard</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Returns merchant profile and recent invoices.</div>
        <div class="params-title">Query Parameters</div>
        <table>
          <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>user_id</td><td>integer</td><td><span class="required">required</span></td><td>Your Telegram user ID</td></tr>
          <tr><td>api_key</td><td>string</td><td><span class="required">required</span></td><td>Your Vertext API key</td></tr>
        </table>
        <div class="params-title">Response</div>
        <pre>{
  <span class="key">"merchant"</span>: {
    <span class="key">"telegram_id"</span>: <span class="num">123456789</span>,
    <span class="key">"internal_balance"</span>: <span class="str">"45.2500"</span>,
    <span class="key">"payout_address"</span>: <span class="str">"TYour...address"</span>,
    <span class="key">"payout_network"</span>: <span class="str">"TRC20"</span>,
    <span class="key">"webhook_url"</span>: <span class="str">"https://yoursite.com/webhook"</span>,
    <span class="key">"locked_amount"</span>: <span class="str">"0.0000"</span>
  },
  <span class="key">"invoices"</span>: [
    {
      <span class="key">"invoice_id"</span>: <span class="str">"uuid-here"</span>,
      <span class="key">"amount_fiat"</span>: <span class="str">"50.00"</span>,
      <span class="key">"description"</span>: <span class="str">"Logo design"</span>,
      <span class="key">"status"</span>: <span class="str">"PAID"</span>,
      <span class="key">"dispute_status"</span>: <span class="str">"NONE"</span>,
      <span class="key">"created_at"</span>: <span class="str">"2025-04-01T12:00:00Z"</span>
    }
  ]
}</pre>
      </div>
    </div>

    <!-- CREATE INVOICE -->
    <h2 id="invoices-create">POST /api/invoices</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/invoices</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Creates a new payment invoice and returns a shareable link.</div>
        <div class="params-title">Headers</div>
        <table>
          <tr><th>Header</th><th>Required</th><th>Description</th></tr>
          <tr><td>X-Merchant-Id</td><td><span class="required">required</span></td><td>Your Telegram user ID</td></tr>
          <tr><td>X-Api-Key</td><td><span class="required">required</span></td><td>Your Vertext API key</td></tr>
          <tr><td>Content-Type</td><td><span class="required">required</span></td><td>application/json</td></tr>
        </table>
        <div class="params-title">Request Body</div>
        <table>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>amount</td><td>number</td><td><span class="required">required</span></td><td>Invoice amount in USD (min $1.00)</td></tr>
          <tr><td>description</td><td>string</td><td><span class="required">required</span></td><td>Invoice description (max 200 chars)</td></tr>
        </table>
        <div class="params-title">Response</div>
        <pre>{
  <span class="key">"invoice_id"</span>: <span class="str">"550e8400-e29b-41d4-a716-446655440000"</span>,
  <span class="key">"link"</span>: <span class="str">"https://t.me/Vertextmarketbot?start=inv_550e..."</span>,
  <span class="key">"amount"</span>: <span class="num">50.00</span>,
  <span class="key">"description"</span>: <span class="str">"Logo design"</span>,
  <span class="key">"status"</span>: <span class="str">"PENDING"</span>,
  <span class="key">"created_at"</span>: <span class="str">"2025-04-01T12:00:00Z"</span>
}</pre>
      </div>
    </div>

    <!-- WITHDRAW -->
    <h2 id="withdraw">POST /api/withdraw</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/withdraw</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Initiates a withdrawal request. A confirmation message will be sent to your Telegram.</div>
        <div class="params-title">Request Body</div>
        <table>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>amount</td><td>number</td><td><span class="required">required</span></td><td>Amount to withdraw in USD</td></tr>
        </table>
        <div class="params-title">Response</div>
        <pre>{
  <span class="key">"message"</span>: <span class="str">"Withdrawal initiated. Check Telegram for confirmation."</span>,
  <span class="key">"withdrawal_id"</span>: <span class="str">"uuid-here"</span>,
  <span class="key">"net_payout"</span>: <span class="num">43.00</span>
}</pre>
      </div>
    </div>

    <!-- WITHDRAWALS LIST -->
    <h2 id="withdrawals">GET /api/withdrawals</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/api/withdrawals</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Returns the merchant's withdrawal history (last 50).</div>
        <div class="params-title">Response</div>
        <pre>{
  <span class="key">"withdrawals"</span>: [
    {
      <span class="key">"withdrawal_id"</span>: <span class="str">"uuid"</span>,
      <span class="key">"amount_requested"</span>: <span class="str">"45.00"</span>,
      <span class="key">"fee_deducted"</span>: <span class="str">"2.00"</span>,
      <span class="key">"net_payout"</span>: <span class="str">"43.00"</span>,
      <span class="key">"status"</span>: <span class="str">"COMPLETED"</span>,
      <span class="key">"created_at"</span>: <span class="str">"2025-04-01T12:00:00Z"</span>
    }
  ]
}</pre>
      </div>
    </div>

    <!-- API KEY -->
    <h2 id="apikey">POST /api/apikey</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/apikey</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Generates or regenerates an API key. Only requires Merchant ID (no existing key needed).</div>
        <div class="params-title">Headers</div>
        <table>
          <tr><th>Header</th><th>Required</th><th>Description</th></tr>
          <tr><td>X-Merchant-Id</td><td><span class="required">required</span></td><td>Your Telegram user ID</td></tr>
        </table>
        <div class="params-title">Response</div>
        <pre>{
  <span class="key">"api_key"</span>: <span class="str">"vxt_a1b2c3d4e5f6..."</span>,
  <span class="key">"message"</span>: <span class="str">"API key generated. Save this — it won't be shown again."</span>
}</pre>
      </div>
    </div>

    <!-- WEBHOOK URL SET -->
    <h2 id="webhook-url">POST /api/webhook-url</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/api/webhook-url</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Sets or updates your merchant webhook URL.</div>
        <div class="params-title">Request Body</div>
        <table>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
          <tr><td>webhook_url</td><td>string</td><td><span class="required">required</span></td><td>HTTPS URL to receive payment events</td></tr>
        </table>
        <div class="params-title">Response</div>
        <pre>{ <span class="key">"message"</span>: <span class="str">"Webhook URL saved."</span> }</pre>
      </div>
    </div>

    <!-- WEBHOOK URL DELETE -->
    <h2 id="webhook-url-del">DELETE /api/webhook-url</h2>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method delete">DELETE</span>
        <span class="path">/api/webhook-url</span>
        <span class="badge-auth">Auth Required</span>
      </div>
      <div class="endpoint-body">
        <div class="endpoint-desc">Removes your configured webhook URL.</div>
        <div class="params-title">Response</div>
        <pre>{ <span class="key">"message"</span>: <span class="str">"Webhook URL removed."</span> }</pre>
      </div>
    </div>

    <!-- WEBHOOK EVENTS -->
    <h2 id="webhook-events">Webhook Payment Events</h2>
    <p>When a customer pays an invoice, Vertext will POST a JSON payload to your configured webhook URL:</p>
    <pre>{
  <span class="key">"event"</span>: <span class="str">"payment.confirmed"</span>,
  <span class="key">"invoice_id"</span>: <span class="str">"550e8400-..."</span>,
  <span class="key">"amount_usd"</span>: <span class="num">50.00</span>,
  <span class="key">"crypto_amount"</span>: <span class="num">0.00182</span>,
  <span class="key">"currency"</span>: <span class="str">"eth"</span>,
  <span class="key">"txid"</span>: <span class="str">"0xabc123..."</span>,
  <span class="key">"status"</span>: <span class="str">"PAID"</span>,
  <span class="key">"merchant_id"</span>: <span class="num">123456789</span>,
  <span class="key">"timestamp"</span>: <span class="str">"2025-04-01T12:00:00Z"</span>
}</pre>
    <p>Your server must respond with HTTP 200 within 8 seconds. Failed deliveries are logged but not retried.</p>

    <!-- WEBHOOK VERIFY -->
    <h2 id="webhook-verify">Webhook Signature Verification</h2>
    <p>Every webhook request includes an <span class="code">X-Vertext-Signature</span> header — an HMAC-SHA256 of the request body, signed with your API key.</p>
    <pre><span class="comment"># Node.js verification example</span>
const crypto = require('crypto');

function verifyWebhook(body, signature, apiKey) {
  const expected = crypto
    .createHmac(<span class="str">'sha256'</span>, apiKey)
    .update(JSON.stringify(body))
    .digest(<span class="str">'hex'</span>);
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}</pre>

    <!-- NODE EXAMPLE -->
    <h2 id="example-node">Node.js Example</h2>
    <pre><span class="comment">// Create an invoice and get the payment link</span>
const res = await fetch(<span class="str">'https://vertextbot.onrender.com/api/invoices'</span>, {
  method: <span class="str">'POST'</span>,
  headers: {
    <span class="str">'Content-Type'</span>: <span class="str">'application/json'</span>,
    <span class="str">'X-Merchant-Id'</span>: <span class="str">'123456789'</span>,
    <span class="str">'X-Api-Key'</span>: <span class="str">'vxt_your_key_here'</span>,
  },
  body: JSON.stringify({
    amount: <span class="num">50.00</span>,
    description: <span class="str">'Website design deposit'</span>,
  }),
});
const data = await res.json();
console.log(data.link); <span class="comment">// https://t.me/Vertextmarketbot?start=inv_...</span></pre>

    <!-- PYTHON EXAMPLE -->
    <h2 id="example-python">Python Example</h2>
    <pre><span class="comment"># Create an invoice</span>
import requests

response = requests.post(
    <span class="str">'https://vertextbot.onrender.com/api/invoices'</span>,
    headers={
        <span class="str">'X-Merchant-Id'</span>: <span class="str">'123456789'</span>,
        <span class="str">'X-Api-Key'</span>: <span class="str">'vxt_your_key_here'</span>,
    },
    json={
        <span class="str">'amount'</span>: <span class="num">50.00</span>,
        <span class="str">'description'</span>: <span class="str">'Website design deposit'</span>,
    }
)
data = response.json()
print(data[<span class="str">'link'</span>])  <span class="comment"># Share this with your customer</span></pre>

  </div>
</div>
<div class="footer">
  © 2025 Vertext Platform ·
  <a href="/terms">Terms</a>
  <a href="/privacy">Privacy</a>
  <a href="/dashboard">Dashboard</a>
</div>
</body>
</html>`;
}
