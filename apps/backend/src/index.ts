import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { startBillingCron } from "./jobs/billingCron.js";

async function main() {
  await connectDb();
  startBillingCron();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal error during startup:", err);
  process.exit(1);
});
