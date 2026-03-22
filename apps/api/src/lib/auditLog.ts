import { supabaseAdmin } from "./supabase";

type CreateAuditLogInput = {
  userId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  issueId?: string | null;
  detail?: Record<string, unknown>;
}

export const createAuditLog = async ({ userId, action, targetType, targetId = null, issueId = null, detail = {}, }: CreateAuditLogInput) => {
  const { error } = await supabaseAdmin
    .from("audit_logs")
    .insert({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      issue_id: issueId,
      detail,
    });

  if (error) {
    console.error("Failed to create audit log:", error);
  }
}