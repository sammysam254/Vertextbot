export function getPrivacyHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Privacy Policy — Vertext</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#080810;color:#e8e8f0;line-height:1.7;padding:0}
.header{background:#0f0f1c;border-bottom:1px solid #1e1e35;padding:20px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Space Mono',monospace;font-size:20px;color:#7c4dff;text-decoration:none;letter-spacing:-1px}
.nav-links a{color:#6b6b8a;text-decoration:none;font-size:13px;margin-left:20px}
.nav-links a:hover{color:#7c4dff}
.container{max-width:760px;margin:0 auto;padding:48px 24px}
h1{font-size:36px;font-weight:700;margin-bottom:8px;font-family:'Space Mono',monospace;color:#7c4dff}
.effective{color:#6b6b8a;font-size:13px;margin-bottom:40px;font-family:'Space Mono',monospace}
h2{font-size:20px;font-weight:600;margin:36px 0 12px;color:#e8e8f0;padding-bottom:8px;border-bottom:1px solid #1e1e35}
p{color:#a0a0b8;margin-bottom:16px;font-size:15px}
ul{color:#a0a0b8;margin:0 0 16px 20px;font-size:15px}
ul li{margin-bottom:8px}
.highlight{background:#0f0f1c;border-left:3px solid #7c4dff;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;color:#e8e8f0}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}
th{background:#0f0f1c;padding:12px 16px;text-align:left;color:#a0a0b8;font-weight:600;border:1px solid #1e1e35}
td{padding:12px 16px;border:1px solid #1e1e35;color:#a0a0b8;vertical-align:top}
.footer{background:#0f0f1c;border-top:1px solid #1e1e35;padding:24px;text-align:center;color:#6b6b8a;font-size:13px;margin-top:60px}
.footer a{color:#6b6b8a;text-decoration:none;margin:0 12px}
.footer a:hover{color:#7c4dff}
</style>
</head>
<body>
<div class="header">
  <a href="/dashboard" class="logo">VERTEXT</a>
  <div class="nav-links">
    <a href="/dashboard">Dashboard</a>
    <a href="/terms">Terms</a>
    <a href="/api-docs">API Docs</a>
  </div>
</div>
<div class="container">
  <h1>Privacy Policy</h1>
  <div class="effective">Effective Date: January 1, 2025 · Last Updated: April 2025</div>

  <div class="highlight">
    Your privacy matters. This policy explains what data we collect, why we collect it, and how we protect it. We do not sell your personal data to third parties.
  </div>

  <h2>1. Information We Collect</h2>
  <p>We collect the following information when you use Vertext:</p>
  <table>
    <tr><th>Data Type</th><th>Examples</th><th>Purpose</th></tr>
    <tr><td>Telegram Identity</td><td>Telegram user ID, username, first name</td><td>Account identification, notifications</td></tr>
    <tr><td>Wallet Information</td><td>Payout address, preferred network</td><td>Processing withdrawals</td></tr>
    <tr><td>Transaction Data</td><td>Invoice amounts, payment status, TXIDs</td><td>Processing payments, dispute resolution</td></tr>
    <tr><td>API Credentials</td><td>API keys, webhook URLs</td><td>B2B integrations</td></tr>
    <tr><td>Communication Data</td><td>Bot message history, dispute reasons</td><td>Customer support, dispute resolution</td></tr>
  </table>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>Processing payments and withdrawals</li>
    <li>Sending payment confirmations and receipts</li>
    <li>Resolving disputes between merchants and customers</li>
    <li>Preventing fraud and complying with legal obligations</li>
    <li>Improving the platform's features and performance</li>
    <li>Sending important service announcements via Telegram</li>
  </ul>

  <h2>3. Data Storage & Security</h2>
  <p>Your data is stored in Supabase (PostgreSQL), hosted on secure cloud infrastructure. We implement:</p>
  <ul>
    <li>Row-Level Security (RLS) on all database tables</li>
    <li>HMAC-SHA256 signing for all API keys and webhooks</li>
    <li>HMAC-SHA512 verification for all NOWPayments webhooks</li>
    <li>HTTPS/TLS encryption for all data in transit</li>
    <li>Service-role key isolation (anon keys never exposed)</li>
  </ul>

  <h2>4. Data Sharing</h2>
  <p>We share data only with:</p>
  <ul>
    <li><strong>NOWPayments</strong> — To process cryptocurrency payments (payment amount, callback URL, order ID)</li>
    <li><strong>Your configured webhook</strong> — If you set a merchant webhook URL, we send payment events to it</li>
    <li><strong>Legal authorities</strong> — If required by law or to prevent fraud</li>
  </ul>
  <p>We never sell your data to advertisers or data brokers.</p>

  <h2>5. Data Retention</h2>
  <p>We retain your data as follows:</p>
  <ul>
    <li>Active account data: Retained while your account is active</li>
    <li>Transaction records: Retained for 7 years for accounting compliance</li>
    <li>Dispute records: Retained for 2 years after resolution</li>
    <li>API request logs: Retained for 90 days</li>
  </ul>

  <h2>6. Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Request a copy of all data we hold about you</li>
    <li>Request deletion of your account and associated data (subject to legal retention requirements)</li>
    <li>Update your wallet address or payout network</li>
    <li>Remove your webhook URL at any time</li>
    <li>Opt out of non-essential communications</li>
  </ul>
  <p>To exercise these rights, contact us through @Vertextmarketbot on Telegram.</p>

  <h2>7. Cookies & Local Storage</h2>
  <p>The web dashboard uses browser localStorage to save your session credentials (Telegram ID and API key) for convenience. This data never leaves your device. You can clear it by clicking "Logout" in the dashboard or clearing your browser's local storage.</p>

  <h2>8. Third-Party Services</h2>
  <p>We use the following third-party services:</p>
  <ul>
    <li><strong>Telegram</strong> — Bot platform and user authentication</li>
    <li><strong>NOWPayments</strong> — Cryptocurrency payment processing</li>
    <li><strong>Supabase</strong> — Database and backend infrastructure</li>
    <li><strong>Render</strong> — Server hosting</li>
    <li><strong>Google Fonts</strong> — Typography (loaded client-side)</li>
  </ul>

  <h2>9. Children's Privacy</h2>
  <p>Vertext is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has registered, contact us immediately.</p>

  <h2>10. Changes to This Policy</h2>
  <p>We may update this privacy policy periodically. We will notify merchants of significant changes via the Telegram bot. Continued use constitutes acceptance of the updated policy.</p>

  <h2>11. Contact Us</h2>
  <p>For privacy-related inquiries, contact us via @Vertextmarketbot on Telegram. We aim to respond within 48 hours.</p>
</div>
<div class="footer">
  © 2025 Vertext Platform · 
  <a href="/terms">Terms</a>
  <a href="/privacy">Privacy</a>
  <a href="/api-docs">API Docs</a>
  <a href="/dashboard">Dashboard</a>
</div>
</body>
</html>`;
}
