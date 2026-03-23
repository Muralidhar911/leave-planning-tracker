import app from "./app.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

console.log(`[startup] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[startup] DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
console.log(`[startup] SESSION_SECRET set: ${!!process.env.SESSION_SECRET}`);
console.log(`[startup] FRONTEND_URL: ${process.env.FRONTEND_URL ?? "not set (defaulting to localhost)"}`);

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});

