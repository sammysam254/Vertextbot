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
