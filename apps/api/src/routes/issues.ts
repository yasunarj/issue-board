import { Hono } from "hono";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import type { AppEnv } from "..";

const issues = new Hono<AppEnv>();

const createIssueSchema = z.object({
  title: z.string().min(1, "title is required").max(100, "title too long"),
  description: z.string().min(1, "description is required").max(2000, "description too long"),
  dueDate: z.iso.date().optional().transform((v) => (v === "" ? undefined : v)),
});

issues.use("*", authMiddleware);

issues.post("/", requireRole(["member", "admin"]), async (c) => {
  const body = await c.req.json();

  const result = createIssueSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400)
  }

  const user = c.get("user");
  const { title, description, dueDate } = result.data;

  const { data, error } = await supabaseAdmin
    .from("issues")
    .insert({
      title,
      description,
      due_date: dueDate || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(
    {
      message: "Issue created",
      issue: data,
    },
    201
  )
});

export default issues;