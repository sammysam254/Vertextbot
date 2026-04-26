import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Telegraf } from 'telegraf';
import { CONFIG } from './config';
import { getInvoice, markInvoicePaid, creditMerchantBalance } from './supabase';

export function createServer(bot: Telegraf) {
  const app = express();

  // ── Raw body for HMAC verification ────────────────────────────────────────
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // ─── Health / keep-alive endpoint ─────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
  });

  app.get('/ping', (_req: Request, res: Response) => {
    res.status(200).send('pong');
  });

  // ─── Telegram Webhook (only used in production with USE_WEBHOOK=true) ──────
  if (CONFIG.USE_WEBHOOK && CONFIG.WEBHOOK_DOMAIN) {
    const webhookPath = `/webhook/telegram/${CONFIG.BOT_TOKEN}`;
    app.use(bot.webhookCallback(webhookPath));
    console.log(`[server] Telegram webhook active at ${webhookPath}`);
  }

  // ─── NOWPayments IPN Webhook ───────────────────────────────────────────────

  app.get('/dashboard', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vertext Dashboard</title><script src="https://telegram.org/js/telegram-web-app.js"></script><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#0f0f1a;color:#fff;padding:16px;min-height:100vh}.card{background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #2d3748;border-radius:16px;padding:20px;margin-bottom:20px}.amount{font-size:36px;font-weight:800;color:#68d391;margin:8px 0 4px}.sub{color:#718096;font-size:13px}.item{background:#1a202c;border:1px solid #2d3748;border-radius:12px;padding:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}.label{color:#a0aec0;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}.btn{width:100%;padding:14px;background:#2d3748;color:#e2e8f0;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:16px}.loading{text-align:center;color:#718096;padding:40px}.err{color:#fc8181;padding:20px;text-align:center}</style></head><body><div id="app"><div class="loading">Loading your dashboard...</div></div><script>const tg=window.Telegram.WebApp;tg.ready();tg.expand();async function load(){const uid=tg.initDataUnsafe?.user?.id;if(!uid){document.getElementById('app').innerHTML='<div class=err>Please open via Telegram bot.</div>';return;}try{const r=await fetch('/api/dashboard?user_id='+uid);if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();const m=d.merchant;const inv=d.invoices||[];const paid=inv.filter(i=>i.status==='PAID').length;const disputes=inv.filter(i=>i.dispute_status==='OPEN').length;document.getElementById('app').innerHTML='<div class=card><div class=label>Available Balance</div><div class=amount>$'+Number(m.internal_balance).toFixed(4)+'</div><div class=sub>USDT on '+m.payout_network+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px"><div class=card style="text-align:center;padding:12px"><div style="font-size:20px;font-weight:700">'+inv.length+'</div><div class=sub>Invoices</div></div><div class=card style="text-align:center;padding:12px"><div style="font-size:20px;font-weight:700;color:#68d391">'+paid+'</div><div class=sub>Paid</div></div><div class=card style="text-align:center;padding:12px"><div style="font-size:20px;font-weight:700;color:'+(disputes>0?'#fc8181':'#68d391')+'">'+disputes+'</div><div class=sub>Disputes</div></div></div><div class=label>Recent Invoices</div>'+inv.slice(0,20).map(i=>'<div class=item><div><div style="font-size:13px;font-weight:500">'+i.description.slice(0,30)+'</div><div style="color:#718096;font-size:11px">'+new Date(i.created_at).toLocaleDateString()+'</div></div><div style="text-align:right"><div style="font-weight:700">$'+Number(i.amount_fiat).toFixed(2)+'</div><div style="font-size:10px;color:'+(i.status==='PAID'?'#68d391':i.status==='EXPIRED'?'#fc8181':'#ecc94b')+'">'+i.status+'</div></div></div>').join('')+'<button class=btn onclick="tg.close()">Close Dashboard</button>';}catch(e){document.getElementById('app').innerHTML='<div class=err>Error: '+e.message+'</div>';}}load();</script></body></html>`);
  });

  app.get('/api/dashboard', async (req: Request, res: Response) => {
    const userId = parseInt(req.query.user_id as string, 10);
    if (!userId || isNaN(userId)) return res.status(400).json({ error: 'Missing user_id' });
    try {
      const [merchantRes, invoicesRes] = await Promise.all([
        supabase.from('merchants').select('*').eq('telegram_id', userId).single(),
        supabase.from('invoices').select('*').eq('merchant_id', userId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (merchantRes.error || !merchantRes.data) return res.status(404).json({ error: 'Merchant not found' });
      res.json({ merchant: merchantRes.data, invoices: invoicesRes.data ?? [] });
    } catch { res.status(500).json({ error: 'Internal error' }); }
  });

  app.post('/webhook/nowpayments', async (req: any, res: Response) => {
    // 1. Verify HMAC signature
    const signature = req.headers['x-nowpayments-sig'] as string;
    if (!verifyNOWPaymentsSignature(req.rawBody, signature)) {
      console.warn('[webhook] Invalid NOWPayments signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    const { payment_status, order_id, price_amount } = payload;

    console.log(`[webhook] NOWPayments event: ${payment_status} for order ${order_id}`);

    // 2. Only process confirmed/finished payments
    if (!['finished', 'confirmed'].includes(payment_status)) {
      return res.status(200).json({ received: true, action: 'ignored' });
    }

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    try {
      // 3. Load invoice
      const invoice = await getInvoice(order_id);
      if (!invoice) {
        console.warn(`[webhook] Invoice not found: ${order_id}`);
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.status === 'PAID') {
        // Idempotent — already processed
        return res.status(200).json({ received: true, action: 'already_paid' });
      }

      // 4. Mark invoice paid and credit merchant
      await markInvoicePaid(order_id);
      await creditMerchantBalance(invoice.merchant_id, price_amount ?? invoice.amount_fiat);

      console.log(
        `[webhook] ✅ Invoice ${order_id} paid — credited $${price_amount} to merchant ${invoice.merchant_id}`
      );

      // 5. Notify merchant via Telegram
      await bot.telegram.sendMessage(
        invoice.merchant_id,
        `💰 *Payment Received!*\n\n` +
          `Invoice: \`${order_id}\`\n` +
          `Amount: *$${Number(price_amount ?? invoice.amount_fiat).toFixed(2)} USDT*\n\n` +
          `Your internal balance has been credited. Use /balance to check.`,
        { parse_mode: 'Markdown' }
      );

      return res.status(200).json({ received: true, action: 'credited' });
    } catch (err) {
      console.error('[webhook] Processing error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });

  // ─── Global error handler ──────────────────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

function verifyNOWPaymentsSignature(rawBody: Buffer, signature: string): boolean {
  if (!signature || !CONFIG.NOW_IPN_SECRET) return false;
  try {
    const hmac = crypto
      .createHmac('sha512', CONFIG.NOW_IPN_SECRET)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}
