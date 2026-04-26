import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Telegraf, Markup } from 'telegraf';
import { CONFIG } from './config';
import { getInvoice, markInvoicePaid, creditMerchantBalance, supabase, createInvoice, createWithdrawal } from './supabase';
import { getDashboardHTML } from './pages/dashboard';
import { getTermsHTML } from './pages/terms';
import { getPrivacyHTML } from './pages/privacy';
import { getApiDocsHTML } from './pages/apiDocs';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function authMerchant(req: Request, res: Response): Promise<{ merchant: any } | null> {
  const merchantId = parseInt((req.headers['x-merchant-id'] as string) ?? (req.query.user_id as string), 10);
  const apiKey = (req.headers['x-api-key'] as string) ?? (req.query.api_key as string);

  if (!merchantId || isNaN(merchantId)) {
    res.status(400).json({ error: 'Missing X-Merchant-Id header' });
    return null;
  }

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('telegram_id', merchantId)
    .single();

  if (error || !merchant) {
    res.status(404).json({ error: 'Merchant not found. Register via the Telegram bot first.' });
    return null;
  }

  // Allow Telegram Mini App access without API key
  if (apiKey === 'tg_auth') return { merchant };

  // Verify API key
  if (!apiKey || merchant.api_key !== apiKey) {
    res.status(401).json({ error: 'Invalid API key. Generate one with /apikey in the bot.' });
    return null;
  }

  return { merchant };
}

export function createServer(bot: Telegraf) {
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));

  // ─── Static pages ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', ts: new Date().toISOString() }));
  app.get('/ping', (_req, res) => res.status(200).send('pong'));
  app.get('/', (_req, res) => res.redirect('/dashboard'));
  app.get('/dashboard', (_req: Request, res: Response) => { res.setHeader('Content-Type', 'text/html'); res.send(getDashboardHTML()); });
  app.get('/terms', (_req: Request, res: Response) => { res.setHeader('Content-Type', 'text/html'); res.send(getTermsHTML()); });
  app.get('/privacy', (_req: Request, res: Response) => { res.setHeader('Content-Type', 'text/html'); res.send(getPrivacyHTML()); });
  app.get('/api-docs', (_req: Request, res: Response) => { res.setHeader('Content-Type', 'text/html'); res.send(getApiDocsHTML()); });

  // ─── Telegram Webhook ─────────────────────────────────────────────────────
  if (CONFIG.USE_WEBHOOK && CONFIG.WEBHOOK_DOMAIN) {
    const webhookPath = `/webhook/telegram/${CONFIG.BOT_TOKEN}`;
    app.use(bot.webhookCallback(webhookPath));
    console.log(`[server] Telegram webhook at ${webhookPath}`);
  }

  // ─── API: Dashboard ───────────────────────────────────────────────────────
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('merchant_id', auth.merchant.telegram_id)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ merchant: auth.merchant, invoices: invoices ?? [] });
  });

  // ─── API: Create Invoice ──────────────────────────────────────────────────
  app.post('/api/invoices', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    const { amount, description } = req.body;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 1) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is $1.00' });
    }
    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (String(description).length > 200) {
      return res.status(400).json({ error: 'Description max 200 characters' });
    }
    try {
      const invoice = await createInvoice(auth.merchant.telegram_id, parseFloat(amount), String(description).trim());
      const link = `https://t.me/${CONFIG.BOT_USERNAME}?start=inv_${invoice.invoice_id}`;
      res.json({ invoice_id: invoice.invoice_id, link, amount: parseFloat(amount), description, status: 'PENDING', created_at: invoice.created_at });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create invoice: ' + err.message });
    }
  });

  // ─── API: Withdrawals list ────────────────────────────────────────────────
  app.get('/api/withdrawals', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('merchant_id', auth.merchant.telegram_id)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ withdrawals: data ?? [] });
  });

  // ─── API: Request Withdrawal ──────────────────────────────────────────────
  app.post('/api/withdraw', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    const { amount } = req.body;
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const balance = Number(auth.merchant.internal_balance);
    if (balance < amountNum) return res.status(422).json({ error: 'Insufficient balance. Available: $' + balance.toFixed(4) });

    const networkFee = 1.0;
    const platformFee = 1.0;
    const netPayout = amountNum - networkFee - platformFee;
    if (netPayout <= 0) return res.status(422).json({ error: 'Amount too small to cover fees ($2.00 total)' });

    try {
      const wd = await createWithdrawal(auth.merchant.telegram_id, amountNum, networkFee + platformFee, netPayout);
      // Send confirmation to merchant via Telegram
      await bot.telegram.sendMessage(
        auth.merchant.telegram_id,
        `📤 *Withdrawal Request from Dashboard*\n\nGross: \`$${amountNum.toFixed(4)}\`\nFees: \`$${(networkFee + platformFee).toFixed(2)}\`\nNet: \`$${netPayout.toFixed(4)} USDT\`\nTo: \`${auth.merchant.payout_address}\``,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Confirm Withdraw', `confirm_wd_${wd.withdrawal_id}`), Markup.button.callback('❌ Cancel', `cancel_wd_${wd.withdrawal_id}`)],
          ]),
        }
      );
      res.json({ message: 'Withdrawal initiated. Check Telegram for confirmation.', withdrawal_id: wd.withdrawal_id, net_payout: netPayout });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Generate API Key ────────────────────────────────────────────────
  app.post('/api/apikey', async (req: Request, res: Response) => {
    const merchantId = parseInt((req.headers['x-merchant-id'] as string), 10);
    if (!merchantId || isNaN(merchantId)) return res.status(400).json({ error: 'Missing X-Merchant-Id' });

    const { data: merchant } = await supabase.from('merchants').select('*').eq('telegram_id', merchantId).single();
    if (!merchant) return res.status(404).json({ error: 'Merchant not found. Register via bot first.' });

    const newKey = 'vxt_' + crypto.randomBytes(24).toString('hex');
    await supabase.from('merchants').update({ api_key: newKey }).eq('telegram_id', merchantId);

    // Also notify via Telegram
    try {
      await bot.telegram.sendMessage(merchantId, `🔑 *New API Key Generated*\n\n\`${newKey}\`\n\nSave this key — use it to authenticate API requests.`, { parse_mode: 'Markdown' });
    } catch {}

    res.json({ api_key: newKey, message: 'API key generated. Save this — it grants full access to your account.' });
  });

  // ─── API: Set Webhook URL ─────────────────────────────────────────────────
  app.post('/api/webhook-url', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    const { webhook_url } = req.body;
    if (!webhook_url || !String(webhook_url).startsWith('https://')) {
      return res.status(400).json({ error: 'Webhook URL must use HTTPS' });
    }
    await supabase.from('merchants').update({ webhook_url }).eq('telegram_id', auth.merchant.telegram_id);
    res.json({ message: 'Webhook URL saved.' });
  });

  // ─── API: Remove Webhook URL ──────────────────────────────────────────────
  app.delete('/api/webhook-url', async (req: Request, res: Response) => {
    const auth = await authMerchant(req, res);
    if (!auth) return;
    await supabase.from('merchants').update({ webhook_url: null }).eq('telegram_id', auth.merchant.telegram_id);
    res.json({ message: 'Webhook URL removed.' });
  });

  // ─── NOWPayments IPN Webhook ──────────────────────────────────────────────
  app.post('/webhook/nowpayments', async (req: any, res: Response) => {
    const signature = req.headers['x-nowpayments-sig'] as string;
    if (!verifyNOWPaymentsSignature(req.rawBody, signature)) {
      console.warn('[webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const { payment_status, order_id, price_amount, pay_amount, pay_currency, payin_hash } = req.body;
    console.log(`[webhook] NOWPayments: ${payment_status} for order ${order_id}`);
    if (!['finished', 'confirmed'].includes(payment_status)) return res.status(200).json({ received: true, action: 'ignored' });
    if (!order_id) return res.status(400).json({ error: 'Missing order_id' });
    try {
      const invoice = await getInvoice(order_id);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
      if (invoice.status === 'PAID') return res.status(200).json({ received: true, action: 'already_paid' });

      await supabase.from('invoices').update({
        status: 'PAID',
        txid: payin_hash ?? null,
        paid_crypto_amount: pay_amount ?? null,
        paid_currency: pay_currency ?? null,
        escrow_release_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }).eq('invoice_id', order_id);

      await creditMerchantBalance(invoice.merchant_id, price_amount ?? invoice.amount_fiat);

      const { data: merchant } = await supabase.from('merchants').select('*').eq('telegram_id', invoice.merchant_id).single();

      // Fire merchant webhook if configured
      if (merchant?.webhook_url) {
        const { fireMerchantWebhook } = await import('./enterprise/merchantWebhook');
        await fireMerchantWebhook(merchant.webhook_url, {
          event: 'payment.confirmed', invoice_id: order_id,
          amount_usd: Number(price_amount ?? invoice.amount_fiat),
          crypto_amount: Number(pay_amount), currency: pay_currency,
          txid: payin_hash, status: 'PAID',
          timestamp: new Date().toISOString(), merchant_id: invoice.merchant_id,
        }, merchant.api_key);
      }

      await bot.telegram.sendMessage(invoice.merchant_id,
        `💰 *Payment Received!*\n\nInvoice: \`${order_id}\`\nAmount: *$${Number(price_amount ?? invoice.amount_fiat).toFixed(2)} USDT*\n\nFunds held in escrow for 24 hours.`,
        { parse_mode: 'Markdown' }
      );

      const customerTgId = req.body.customer_tg_id ?? (invoice as any).customer_tg_id;
      if (customerTgId) {
        try {
          const { generateReceipt } = await import('./enterprise/pdfReceipt');
          const pdfBuffer = await generateReceipt({
            invoiceId: order_id, merchantId: invoice.merchant_id,
            description: invoice.description,
            fiatAmount: Number(price_amount ?? invoice.amount_fiat),
            cryptoAmount: Number(pay_amount ?? 0),
            currency: pay_currency ?? 'USDT',
            txid: payin_hash ?? 'Pending', paidAt: new Date(),
            network: merchant?.payout_network ?? 'TRC20',
          });
          await bot.telegram.sendDocument(customerTgId,
            { source: pdfBuffer, filename: `receipt_${order_id.slice(0, 8)}.pdf` },
            {
              caption: `🧾 Payment confirmed! $${Number(price_amount ?? invoice.amount_fiat).toFixed(2)} USD\n\n🔒 Escrow active for 24 hours.`,
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([[Markup.button.callback('⚠️ Report Issue', `report_issue_${order_id}`)]]),
            }
          );
        } catch (pdfErr) { console.error('[webhook] PDF error:', pdfErr); }
      }

      return res.status(200).json({ received: true, action: 'credited' });
    } catch (err) { console.error('[webhook] error:', err); return res.status(500).json({ error: 'Internal error' }); }
  });

  // ─── Escrow auto-release every 30 min ─────────────────────────────────────
  setInterval(async () => {
    try {
      const { releaseExpiredEscrows } = await import('./enterprise/disputes');
      await releaseExpiredEscrows();
    } catch (e) { console.error('[escrow-cron]', e); }
  }, 30 * 60 * 1000);

  // ─── Global error handler ─────────────────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

function verifyNOWPaymentsSignature(rawBody: Buffer, signature: string): boolean {
  if (!signature || !CONFIG.NOW_IPN_SECRET) return false;
  try {
    const hmac = crypto.createHmac('sha512', CONFIG.NOW_IPN_SECRET).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch { return false; }
}
