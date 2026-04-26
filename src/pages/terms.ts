export function getTermsHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Terms of Service — Vertext</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#080810;color:#e8e8f0;line-height:1.7;padding:0}
.header{background:#0f0f1c;border-bottom:1px solid #1e1e35;padding:20px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Space Mono',monospace;font-size:20px;color:#00e676;text-decoration:none;letter-spacing:-1px}
.nav-links a{color:#6b6b8a;text-decoration:none;font-size:13px;margin-left:20px}
.nav-links a:hover{color:#00e676}
.container{max-width:760px;margin:0 auto;padding:48px 24px}
h1{font-size:36px;font-weight:700;margin-bottom:8px;font-family:'Space Mono',monospace;color:#00e676}
.effective{color:#6b6b8a;font-size:13px;margin-bottom:40px;font-family:'Space Mono',monospace}
h2{font-size:20px;font-weight:600;margin:36px 0 12px;color:#e8e8f0;padding-bottom:8px;border-bottom:1px solid #1e1e35}
p{color:#a0a0b8;margin-bottom:16px;font-size:15px}
ul{color:#a0a0b8;margin:0 0 16px 20px;font-size:15px}
ul li{margin-bottom:8px}
.highlight{background:#0f0f1c;border-left:3px solid #00e676;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;color:#e8e8f0}
.footer{background:#0f0f1c;border-top:1px solid #1e1e35;padding:24px;text-align:center;color:#6b6b8a;font-size:13px;margin-top:60px}
.footer a{color:#6b6b8a;text-decoration:none;margin:0 12px}
.footer a:hover{color:#00e676}
</style>
</head>
<body>
<div class="header">
  <a href="/dashboard" class="logo">VERTEXT</a>
  <div class="nav-links">
    <a href="/dashboard">Dashboard</a>
    <a href="/privacy">Privacy</a>
    <a href="/api-docs">API Docs</a>
  </div>
</div>
<div class="container">
  <h1>Terms of Service</h1>
  <div class="effective">Effective Date: January 1, 2025 · Last Updated: April 2025</div>

  <div class="highlight">
    By using Vertext ("the Platform"), you agree to these Terms. Please read them carefully before registering as a merchant or making any payments.
  </div>

  <h2>1. Acceptance of Terms</h2>
  <p>By accessing or using the Vertext platform, including the Telegram bot (@Vertextmarketbot), web dashboard, or API, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>

  <h2>2. Description of Service</h2>
  <p>Vertext is a centralized crypto escrow and invoicing platform that enables merchants to:</p>
  <ul>
    <li>Generate payment invoices for their customers</li>
    <li>Collect cryptocurrency payments through NOWPayments</li>
    <li>Hold funds in escrow with dispute protection</li>
    <li>Withdraw settled funds to their registered wallet address</li>
  </ul>

  <h2>3. Merchant Accounts</h2>
  <p>To use merchant features, you must:</p>
  <ul>
    <li>Have a valid Telegram account</li>
    <li>Register a valid cryptocurrency wallet address for payouts</li>
    <li>Provide accurate information about your business</li>
    <li>Be at least 18 years of age</li>
  </ul>
  <p>You are responsible for maintaining the security of your API keys and wallet addresses. Vertext is not liable for losses due to compromised credentials.</p>

  <h2>4. Fees</h2>
  <p>Vertext charges the following fees:</p>
  <ul>
    <li><strong>Platform Fee:</strong> $1.00 USD per withdrawal</li>
    <li><strong>Network Fee:</strong> Variable based on the blockchain network (TRC20, BEP20, or Polygon)</li>
    <li>No fees are charged on incoming payments or invoice creation</li>
  </ul>
  <p>Fees are deducted automatically from withdrawal amounts. We reserve the right to update fees with 7 days notice.</p>

  <h2>5. Escrow & Dispute Policy</h2>
  <p>All confirmed payments are held in escrow for 24 hours. During this window:</p>
  <ul>
    <li>Customers may file a dispute for legitimate reasons (item not received, fraud, etc.)</li>
    <li>Disputed funds are frozen and cannot be withdrawn</li>
    <li>An admin will review and resolve disputes within 24–72 hours</li>
    <li>Abuse of the dispute system (false claims) may result in account suspension</li>
  </ul>
  <p>After the 24-hour escrow window closes without a dispute, funds are released to the merchant's balance automatically.</p>

  <h2>6. Prohibited Activities</h2>
  <p>You may not use Vertext for:</p>
  <ul>
    <li>Illegal goods or services</li>
    <li>Money laundering or financial fraud</li>
    <li>Gambling or adult content services</li>
    <li>Any activity that violates applicable laws</li>
    <li>Spamming customers with fraudulent invoices</li>
  </ul>
  <p>Violation of these terms will result in immediate account suspension and potential reporting to authorities.</p>

  <h2>7. Cryptocurrency Risk</h2>
  <p>Cryptocurrency transactions are irreversible. Vertext is not responsible for:</p>
  <ul>
    <li>Funds sent to incorrect wallet addresses</li>
    <li>Network delays or failures on third-party blockchains</li>
    <li>Fluctuations in cryptocurrency value</li>
    <li>NOWPayments API downtime or errors</li>
  </ul>

  <h2>8. Limitation of Liability</h2>
  <p>Vertext's total liability to any merchant or customer shall not exceed the amount of fees paid to Vertext in the 30 days prior to the claim. We are not liable for indirect, incidental, or consequential damages.</p>

  <h2>9. Account Termination</h2>
  <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose a risk to the platform. Pending balances may be withheld during investigations.</p>

  <h2>10. Changes to Terms</h2>
  <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. Major changes will be announced via the Telegram bot.</p>

  <h2>11. Contact</h2>
  <p>For questions about these terms, contact us through the Telegram bot @Vertextmarketbot or via the admin channel.</p>
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
