import { Hono } from "hono";
import { requireRole } from "../middleware/requireRole";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

const auditLogs = new Hono();

auditLogs.use("*", authMiddleware);

auditLogs.get("/", requireRole(["admin"]), async (c) => {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select(`
      id,
      action,
      target_type,
      target_id,
      detail,
      created_at,
      user_profile:profiles (
        id,
        role,
        display_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ error: "Failed to fetch logs" }, 500);
  }

  return c.json({
    ok: true,
    logs: data ?? [],
  })
});

export default auditLogs;