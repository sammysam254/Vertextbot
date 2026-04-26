import axios from 'axios';
import crypto from 'crypto';

export interface WebhookPayload {
  event: 'payment.confirmed' | 'dispute.opened' | 'dispute.resolved';
  invoice_id: string;
  amount_usd: number;
  crypto_amount?: number;
  currency?: string;
  txid?: string;
  status: string;
  timestamp: string;
  merchant_id: number;
}

export async function fireMerchantWebhook(webhookUrl: string, payload: WebhookPayload, apiKey?: string): Promise<void> {
  try {
    const body = JSON.stringify(payload);
    const signature = apiKey ? crypto.createHmac('sha256', apiKey).update(body).digest('hex') : '';
    await axios.post(webhookUrl, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json', 'X-Vertext-Signature': signature, 'X-Vertext-Event': payload.event, 'User-Agent': 'Vertext-Escrow-Bot/2.0' },
    });
    console.log(`[webhook] Fired to ${webhookUrl} for invoice ${payload.invoice_id}`);
  } catch (err: any) {
    console.error(`[webhook] FAILED for ${webhookUrl}:`, err?.response?.status ?? err?.message);
  }
}
