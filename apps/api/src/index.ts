import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { User } from "@supabase/supabase-js";
import me from "./routes/me";
import issues from "./routes/issues";
import auditLogs from "./routes/auditLogs";

export type Role = "member" | "admin" | "viewer";

export type AppEnv = {
  Variables: {
    user: User;
    role: Role;
  }
};

const app = new Hono<AppEnv>();

app.use("*", cors({
  origin: "http://localhost:3000",
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/me", me);
app.route("/issues", issues);
app.route("/audit-logs", auditLogs);


const port = Number(process.env.PORT ?? 8787);
console.log(`API listening on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});



