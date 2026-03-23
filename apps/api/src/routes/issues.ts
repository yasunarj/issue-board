import { Hono } from "hono";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import type { AppEnv } from "..";
import { createAuditLog } from "../lib/auditLog";

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
        role,
        display_name
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

  await createAuditLog({
    userId: user.id,
    action: "issue.create",
    targetType: "issue",
    targetId: data.id,
    issueId: data.id,
    detail: {
      title: data.title,
      due_date: data.due_date,
    },
  });

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
        role,
        display_name
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

issues.delete("/:id", requireRole(["admin"]), async (c) => {
  const issueId = c.req.param("id");
  const user = c.get("user");

  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id, title")
    .eq("id", issueId)
    .single()

  if (issueError || !issue) {
    return c.json({ error: "Issue not found" }, 404)
  }


  const { error } = await supabaseAdmin
    .from("issues")
    .delete()
    .eq("id", issueId)

  if (error) {
    console.error(error);
    return c.json({ error: "Failed to delete issue" }, 500);
  }

  await createAuditLog({
    userId: user.id,
    action: "issue.delete",
    targetType: "issue",
    targetId: issue.id,
    issueId: null,
    detail: {
      title: issue.title ?? null,
    }
  })

  return c.json({
    message: "Issue deleted",
  })
});

issues.patch("/:id", requireRole(["admin"]), async (c) => {
  const issueId = c.req.param("id");
  const body = await c.req.json();
  const result = updateIssueSchema.safeParse(body);
  const user = c.get("user");

  if (!result.success) {
    return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
  }

  const { title, description, dueDate } = result.data;

  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  const { data, error } = await supabaseAdmin
    .from("issues")
    .update({
      title,
      description,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return c.json({ error: "Failed to update issue" }, 500);
  }

  await createAuditLog({
    userId: user.id,
    action: "issue.update",
    targetType: "issue",
    targetId: data.id,
    issueId: data.id,
    detail: {
      title: data.title,
      due_date: data.due_date,
    },
  });

  return c.json({
    message: "Issue updated",
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

  await createAuditLog({
    userId: user.id,
    action: "issue.resolve",
    targetType: "issue",
    targetId: data.id,
    issueId: data.id,
    detail: {
      resolved_by: data.resolved_by,
      resolved_at: data.resolved_at,
    }
  })

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
        role,
        display_name
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

    await createAuditLog({
      userId: user.id,
      action: "comment.create",
      targetType: "comment",
      targetId: insertComment.id,
      issueId: issueId,
      detail: {
        body: insertComment.body,
      }
    })

    return c.json({ message: "comment created", comment: insertComment }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "invalid request" }, 400);
  }
})

issues.delete("/:issueId/comments/:commentId", requireRole(["admin"]), async (c) => {
  const issueId = c.req.param("issueId");
  const commentId = c.req.param("commentId");
  const user = c.get("user");

  const { data: comment, error: commentError } = await supabaseAdmin
    .from("issue_comments")
    .select("id, issue_id, body")
    .eq("id", commentId)
    .eq("issue_id", issueId)
    .single();

  if (commentError || !comment) {
    return c.json({ error: "Comment not found" }, 404);
  }

  const { error } = await supabaseAdmin
    .from("issue_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error(error);
    return c.json({ error: "Failed to delete comment" }, 500);
  }

  await createAuditLog({
    userId: user.id,
    action: "comment.delete",
    targetType: "comment",
    targetId: comment.id,
    issueId: comment.issue_id,
    detail: {
      body: comment.body
    },
  });

  return c.json({
    message: "Comment deleted",
  })
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
      role,
      display_name
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

  await createAuditLog({
    userId: user.id,
    action: "issue.check",
    targetType: "check",
    targetId: check.id,
    issueId: issueId,
    detail: {
      checked_at: check.checked_at,
    }
  })

  return c.json(
    {
      message: "Issue checked",
      alreadyChecked: false,
      check,
    },
    201
  );
});

issues.get("/:id/audit-logs", requireRole(["admin"]), async (c) => {
  const issueId = c.req.param("id");
  const { data: issue, error: issueError } = await supabaseAdmin
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .single();

  if (!issue || issueError) {
    return c.json({ error: "issue not found" }, 404);
  }

  const { data: logs, error: logsError } = await supabaseAdmin
    .from("audit_logs")
    .select(`
      id,
      user_id,
      action,
      target_type,
      target_id,
      issue_id,
      detail,
      created_at,
      user_profile:profiles!audit_logs_user_id_fkey (
      id,
      role,
      display_name
      )
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (logsError) {
    console.error(logsError);
    return c.json({ error: "Failed to fetch audit logs" }, 500);
  }

  return c.json({
    ok: true,
    logs: logs ?? []
  })
});

export default issues;

