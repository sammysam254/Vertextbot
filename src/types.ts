export type PayoutNetwork = 'TRC20' | 'BEP20' | 'MATIC';
export type InvoiceStatus = 'PENDING' | 'PAID';
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'MANUAL_REVIEW';

export interface Merchant {
  telegram_id: number;
  internal_balance: number;
  payout_address: string | null;
  payout_network: PayoutNetwork | null;
  created_at: string;
}

export interface Invoice {
  invoice_id: string;
  merchant_id: number;
  amount_fiat: number;
  description: string;
  status: InvoiceStatus;
  created_at: string;
}

export interface Withdrawal {
  withdrawal_id: string;
  merchant_id: number;
  amount_requested: number;
  fee_deducted: number;
  net_payout: number;
  status: WithdrawalStatus;
  created_at: string;
}

export interface NOWPaymentsPaymentResponse {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  payment_status: string;
}

export interface NOWPaymentsPayoutResponse {
  id: string;
  status: string;
  hash: string;
  amount: number;
  currency: string;
}

export interface NOWPaymentsFeeResponse {
  currency: string;
  network_fee: number;
}

// Session state for multi-step onboarding
export interface BotSessionData {
  step?: 'AWAITING_ADDRESS';
  selectedNetwork?: PayoutNetwork;
}

declare module 'telegraf/typings/context' {
  interface Context {
    session?: BotSessionData;
  }
}
