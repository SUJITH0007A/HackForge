import http from "http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { requireEnv, env } from "./config/env.js";
import { initSockets } from "./sockets/index.js";

async function main() {
  requireEnv();
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[hackforge] API listening on :${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

