import dotenv from 'dotenv';
dotenv.config();

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const CONFIG = {
  // Telegram
  BOT_TOKEN: require_env('BOT_TOKEN'),
  BOT_USERNAME: require_env('BOT_USERNAME'),         // e.g. MyEscrowBot (no @)
  ADMIN_CHAT_ID: require_env('ADMIN_CHAT_ID'),       // your admin channel/group id

  // Supabase
  SUPABASE_URL: require_env('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY: require_env('SUPABASE_SERVICE_KEY'),

  // NOWPayments
  NOW_API_KEY: require_env('NOW_API_KEY'),           // deposit API key
  NOW_PAYOUT_KEY: require_env('NOW_PAYOUT_KEY'),     // payout/mass-payout API key
  NOW_IPN_SECRET: require_env('NOW_IPN_SECRET'),     // webhook secret for HMAC

  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN || '', // e.g. https://myapp.onrender.com
  USE_WEBHOOK: process.env.USE_WEBHOOK === 'true',

  // Platform
  PLATFORM_FEE_USD: 1.0,
} as const;
