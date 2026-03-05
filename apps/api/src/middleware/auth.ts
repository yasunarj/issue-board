import { supabaseAdmin } from "../lib/supabase";
import { Context, Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  if (c.req.method === "OPTIONS") return await next();

  const authHeader = c.req.header("Authorization") as string | undefined;
  if(!authHeader) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("user", user);

  await next();
}