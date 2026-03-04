import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);
console.log(`API listening on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});



