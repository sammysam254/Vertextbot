import axios from 'axios';
import { CONFIG } from './config';
import {
  PayoutNetwork,
  NOWPaymentsPaymentResponse,
  NOWPaymentsPayoutResponse,
} from './types';

const BASE = 'https://api.nowpayments.io/v1';

// Currency slugs per payout network
export const NETWORK_CURRENCY: Record<PayoutNetwork, string> = {
  TRC20: 'usdttrc20',
  BEP20: 'usdtbsc',
  MATIC: 'usdtmatic',
};

// Static fallback network fees (USD) – used if live API call fails
const STATIC_FEES: Record<PayoutNetwork, number> = {
  TRC20: 1.0,
  BEP20: 0.5,
  MATIC: 0.3,
};

// ─── Deposits ────────────────────────────────────────────────────────────────

export async function createPayment(
  priceAmountUsd: number,
  invoiceId: string,
  network: PayoutNetwork = 'TRC20'
): Promise<NOWPaymentsPaymentResponse> {
  const currency = NETWORK_CURRENCY[network];
  const { data } = await axios.post(
    `${BASE}/payment`,
    {
      price_amount: priceAmountUsd,
      price_currency: 'usd',
      pay_currency: currency,
      order_id: invoiceId,
      order_description: `Invoice ${invoiceId}`,
      ipn_callback_url: `${CONFIG.WEBHOOK_DOMAIN}/webhook/nowpayments`,
    },
    { headers: { 'x-api-key': CONFIG.NOW_API_KEY } }
  );
  return data;
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export async function createPayout(
  address: string,
  network: PayoutNetwork,
  amountUsd: number,
  withdrawalId: string
): Promise<NOWPaymentsPayoutResponse> {
  const currency = NETWORK_CURRENCY[network];
  const { data } = await axios.post(
    `${BASE}/payout`,
    {
      address,
      currency,
      amount: amountUsd,
      extra_id: withdrawalId,
      payout_description: `Escrow payout ${withdrawalId}`,
    },
    { headers: { 'x-api-key': CONFIG.NOW_PAYOUT_KEY } }
  );
  return data;
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export async function getNetworkFee(network: PayoutNetwork): Promise<number> {
  try {
    const currency = NETWORK_CURRENCY[network];
    const { data } = await axios.get(`${BASE}/estimate`, {
      params: { amount: 1, currency_from: 'usd', currency_to: currency },
      headers: { 'x-api-key': CONFIG.NOW_API_KEY },
    });
    // NOWPayments estimate doesn't return fee directly; use fee endpoint
    const feeRes = await axios.get(`${BASE}/fee/${currency}`, {
      headers: { 'x-api-key': CONFIG.NOW_API_KEY },
    });
    // fee is quoted in the token; assume 1:1 with USD for USDT
    return parseFloat(feeRes.data?.fee ?? STATIC_FEES[network]);
  } catch {
    // Fallback to static fees on API failure
    return STATIC_FEES[network];
  }
}

export function calcFees(networkFeeUsd: number): {
  networkFee: number;
  platformFee: number;
  totalFee: number;
} {
  const networkFee = networkFeeUsd;
  const platformFee = CONFIG.PLATFORM_FEE_USD;
  return { networkFee, platformFee, totalFee: networkFee + platformFee };
}
