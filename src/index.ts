import { CONFIG } from './config';
import { createBot } from './bot';
import { createServer } from './server';

async function main() {
  console.log('[init] Starting Escrow Bot…');

  const bot = createBot();
  const app = createServer(bot);

  // ── Start Express server ──────────────────────────────────────────────────
  const server = app.listen(CONFIG.PORT, () => {
    console.log(`[server] HTTP server listening on port ${CONFIG.PORT}`);
  });

  if (CONFIG.USE_WEBHOOK && CONFIG.WEBHOOK_DOMAIN) {
    // ── Webhook mode (Render / production) ────────────────────────────────
    const webhookUrl = `${CONFIG.WEBHOOK_DOMAIN}/webhook/telegram/${CONFIG.BOT_TOKEN}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`[bot] Webhook set to ${webhookUrl}`);
  } else {
    // ── Long-polling mode (local / Termux development) ────────────────────
    await bot.telegram.deleteWebhook();
    bot.launch({ dropPendingUpdates: true });
    console.log('[bot] Long-polling started');
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`[init] ${signal} received — shutting down gracefully…`);
    bot.stop(signal);
    server.close(() => {
      console.log('[server] HTTP server closed');
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[init] Fatal startup error:', err);
  process.exit(1);
});
