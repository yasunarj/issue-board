import { MiddlewareHandler } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import { Context, Next } from "hono";
import type { AppEnv, Role } from "..";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c: Context, next: Next) => {
  if (c.req.method === "OPTIONS") return await next();
  const authHeader = c.req.header("Authorization") as string | undefined;
  if (!authHeader) {
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("profileError", profileError);
    return c.json({ error: "Failed to fetch role", details: profileError }, 500);
  }

  const role: Role = profile?.role === "member" || profile?.role === "admin" || profile?.role === "viewer" ? profile.role : "member";

  c.set("user", user);
  c.set("role", role);

  await next();
}