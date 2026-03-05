import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { User } from "@supabase/supabase-js";
import me from "./routes/me";

type Variables = {
  user: User;
}

const app = new Hono<{ Variables: Variables }>();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/me", me);

const port = Number(process.env.PORT ?? 8787);
console.log(`API listening on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});



