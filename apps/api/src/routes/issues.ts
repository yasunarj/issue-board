import { Hono } from "hono";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import type { AppEnv } from "..";

const issues = new Hono<AppEnv>();

const createIssueSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(100, "title too long"),
  description: z.string().trim().min(1, "description is required").max(2000, "description too long"),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional().transform((v) => (v === "" ? undefined : v)),
});

const updateIssueSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(100, "title too long"),
  description: z.string().trim().min(1, "description is required").max(2000, "description too long"),
  dueDate: z.union([z.iso.date(), z.literal("")]).optional().transform((v) => (v === "" ? undefined : v))
})

const createCommentSchema = z.object({
  comment: z.string().trim().min(1, "comment is required").max(1000, "comment too long"),
});

issues.use("*", authMiddleware);

issues.get("/", requireRole(["member", "admin", "viewer"]), async (c) => {
  const { data, error } = await supabaseAdmin
    .from("issues")
    .select(`
      id,
      title,
      status,
      due_date,
      created_at,
      created_by,
      created_by_profile:profiles!issues_created_by_fkey (
        id,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ ok: true, issues: data });
})

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

issues.get("/:id", requireRole(["admin", "member", "viewer"]), async (c) => {
  const issueId = c.req.param("id");

  const { data, error } = await supabaseAdmin
    .from("issues")
    .select(`
      id,
      title,
      description,
      status,
      due_date,
      resolved_at,
      created_at,
      updated_at,
      created_by,
      resolved_by,
      created_by_profile:profiles!issues_created_by_fkey (
        id,
        role
      ),
      resolved_by_profile:profiles!issues_resolved_by_fkey (
        id,
        role
      )
    `)
    .eq("id", issueId)
    .single()

  if (error || !data) {
    return c.json({ error: "Issue not found", detail: error.message }, 404);
  }

  return c.json({
    ok: true,
    issue: data,
  })
})

issues.patch("/:id/resolve", requireRole(["admin", "member"]), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const { data, error } = await supabaseAdmin
    .from("issues")
    .update({
      status: "resolved",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log("エラーの詳細", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: "Issue resolved", issue: data })
});

issues.get("/:id/comments", requireRole(["admin", "member", "viewer"]), async (c) => {
  const issueId = c.req.param("id");

  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  const { data: comments, error: commentsError } = await supabaseAdmin
    .from("issue_comments")
    .select(`
      id,
      issue_id,
      user_id,
      body,
      created_at,
      user_profile:profiles!issue_comments_user_id_fkey (
        id,
        role
      )
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return c.json({ error: "Failed to fetch comments" }, 500);
  }

  return c.json({
    ok: true,
    comments,
  })
});

issues.post("/:id/comments", requireRole(["admin", "member"]), async (c) => {
  try {
    const issueId = c.req.param("id");
    const user = c.get("user");
    const body = await c.req.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
    }

    const { comment } = result.data

    const { data: issue, error: issueError } = await supabaseAdmin
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .single();

    if (issueError || !issue) {
      return c.json({ error: "Issue not found" }, 404);
    }

    const { data: insertComment, error: insertError } = await supabaseAdmin
      .from("issue_comments")
      .insert({
        issue_id: issueId,
        user_id: user.id,
        body: comment,
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return c.json({ error: "Failed to create comment" }, 500);
    }

    return c.json({ message: "comment created", comment: insertComment }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "invalid request" }, 400);
  }
})

issues.get("/:id/checks", requireRole(["admin", "member", "viewer"]), async (c) => {
  const issueId = c.req.param("id");

  // 該当するissueが存在するかをチェックする
  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  // 該当するissueにチェック済みがあるかどうかを調べる。ついでにjoinしてチェックしたユーザーの情報も併せてprofilesテーブルから取得する
  const { data: checks, error: checksError } = await supabaseAdmin
    .from("issue_checks")
    .select(`
    id,
    issue_id,
    user_id,
    checked_at,
    user_profile:profiles!issue_checks_user_id_fkey (
      id,
      role
    )
    `)
    .eq("issue_id", issueId)
    .order("checked_at", { ascending: true });

  if (checksError) {
    return c.json({ error: "Failed to fetch checks" }, 500);
  }

  return c.json({ ok: true, checks })
})

issues.post("/:id/check", requireRole(["admin", "member", "viewer"]), async (c) => {
  const issueId = c.req.param("id");
  const user = c.get("user");

  // ここで対象となるissueが存在するのかを確認する
  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  // 次にissue_checkテーブルから該当するissueとログインしているユーザーのidが存在しているかをチェックする
  const { data: existingCheck, error: existingCheckError } = await supabaseAdmin
    .from("issue_checks")
    .select("id")
    .eq("issue_id", issueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingCheckError) {
    console.error(existingCheckError);
    return c.json({ error: "Failed to check existing record" }, 500);
  }

  // もしもテーブルにデータがあればすでにチェック済なのでinsertはしないようにする
  if (existingCheck) {
    return c.json({
      message: "Already checked",
      alreadyChecked: true,
    });
  }

  // テーブルにデータがないということは未チェックなのでここでinsertをする
  const { data: check, error: insertError } = await supabaseAdmin
    .from("issue_checks")
    .insert({
      issue_id: issueId,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error(insertError);
    return c.json({ error: "Failed to create check" }, 500);
  }

  return c.json(
    {
      message: "Issue checked",
      alreadyChecked: false,
      check,
    },
    201
  );
});

export default issues;

