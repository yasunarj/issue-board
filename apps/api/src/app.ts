import { User } from "@supabase/supabase-js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import auditLogs from "./routes/auditLogs";
import issues from "./routes/issues";
import me from "./routes/me";
import internal from "./routes/internal";

export type Role = "member" | "admin" | "viewer";

export type AppEnv = {
  Variables: {
    user: User;
    role: Role;
  };
};

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: "http://localhost:3000",
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));

  app.route("/me", me);
  app.route("/issues", issues);
  app.route("/audit-logs", auditLogs);
  app.route("/internal", internal);

  return app;
};
