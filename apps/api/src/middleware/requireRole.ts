import { MiddlewareHandler } from "hono";
import { Context, Next } from "hono";
import type { AppEnv, Role } from "..";

export const requireRole = (roles: Role[]): MiddlewareHandler<AppEnv> => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const role = c.get("role");

    if (!roles.includes(role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  }
}