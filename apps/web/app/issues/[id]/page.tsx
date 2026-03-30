"use client";
import { useParams } from "next/navigation";
import type { AuditLog } from "../types";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CommentList from "../components/CommentList";
import CheckSection from "../components/CheckSection";
import CommentForm from "../components/CommentForm";
import { useMe } from "@/app/hooks/useMe";
import { formatAction } from "@/app/lib/formatAction";
import { apiFetch } from "@/app/lib/api/client";
import { useIssueDetail } from "../hooks/useIssueDetail";

const IssueDetailPage = () => {
  const params = useParams<{ id: string }>();
  const issueId = params.id as string;
  const { me, isAdmin } = useMe();
  const canResolve = me?.role === "admin" || me?.role === "member";
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isShowAuditLogs, setIsShowAuditLogs] = useState<boolean>(false);

  const fetchAuditLogs = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const res = await apiFetch(`/issues/${issueId}/audit-logs`);

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "監視ログの取得に失敗しました",
          type: "error",
        });
      }

      const formatLogs = data.logs.map((log: AuditLog) => {
        const action = formatAction(log.action);
        return { ...log, action };
      });

      setAuditLogs(formatLogs ?? []);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "監視ログの取得に失敗しました";
      setMessage({ text: message, type: "error" });
    }
  }, [isAdmin, issueId]);

  const {
    issue,
    isLoading,
    comments,
    commentInput,
    setCommentInput,
    commentSubmitting,
    checks,
    checkMessage,
    fetchIssue,
    fetchComments,
    handleCreateComment,
    handleCheckIssue,
    handleDeleteIssue,
    handleResolvedIssue,
  } = useIssueDetail({
    issueId,
    isAdmin,
    setMessage,
    onResolved: fetchAuditLogs,
  });

  useEffect(() => {
    if (!issueId) return;
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [fetchAuditLogs, isAdmin, issueId]);

  useEffect(() => {
    if (!issue) return;

    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditDueDate(issue.due_date ?? "");
  }, [issue]);

  const handleUpdateIssue = async () => {
    setIsUpdating(true);

    try {
      const res = await apiFetch(`/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "更新に失敗しました",
          type: "error",
        });
        return;
      }

      setMessage({ text: "更新しました", type: "success" });
      setIsEditing(false);

      await fetchIssue();
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "更新に失敗しました",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Issue Detail</h1>
          <Link href="/issues" className="text-sm underline underline-offset-4">
            一覧へ戻る
          </Link>
        </div>

        {message && (
          <p
            className={
              message.type === "error" ? "text-red-600" : "text-green-600"
            }
          >
            {message.text}
          </p>
        )}

        {isLoading ? (
          <p>読み込み中...</p>
        ) : !issue ? (
          <p>Issueが見つかりません</p>
        ) : (
          <div className="border rounded p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">{issue.title}</h2>
              {canResolve ? (
                <div className="flex justify-end gap-2">
                  <span className="text-sm border px-2 py-1 rounded">
                    {issue.status}
                  </span>

                  {canResolve && (
                    <button
                      className="text-sm border px-2 py-1 rounded"
                      onClick={handleResolvedIssue}
                    >
                      {issue.status === "open" ? "解決" : "未解決に戻す"}
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        className="bg-yellow-500 text-black px-3 py-1 rounded text-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        編集
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs disabled:hidden"
                        onClick={handleDeleteIssue}
                        disabled={isEditing}
                      >
                        削除
                      </button>
                      <button
                        className="bg-purple-500 px-3 py-1 rounded text-sm"
                        onClick={() => setIsShowAuditLogs((prev) => !prev)}
                      >
                        {isShowAuditLogs ? "ログ非表示" : "ログ表示"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm border px-2 py-1 rounded">
                  {issue.status}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  className="border rounded p-2 bg-white text-black"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  className="border rounded p-2 bg-white text-black"
                  rows={8}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <input
                  type="date"
                  className="border rounded p-2 bg-white text-black"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <button
                    className="border px-3 py-1 rounded"
                    onClick={handleUpdateIssue}
                    disabled={isUpdating}
                  >
                    保存
                  </button>

                  <button
                    className="border px-3 py-1 rounded"
                    onClick={() => setIsEditing(false)}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
            )}

            <div className="text-xs text-gray-600 flex flex-col gap-1">
              <span>
                作成者: {issue.created_by_profile?.display_name ?? "不明"}さん
              </span>
              <span>期限: {issue.due_date ?? "-"}</span>
              <span>
                作成日: {new Date(issue.created_at).toLocaleString("ja-jp")}
              </span>
              <span>
                解決日時:{" "}
                {issue.resolved_at
                  ? new Date(issue.resolved_at).toLocaleString("ja-jp")
                  : "-"}
              </span>
            </div>

            <CommentList
              comments={comments}
              setMessage={setMessage}
              fetchComments={fetchComments}
            />
            <CheckSection
              issueId={issueId}
              checks={checks ?? []}
              onCheck={handleCheckIssue}
              resultMessage={checkMessage ?? null}
            />
            <CommentForm
              issueId={issueId}
              value={commentInput}
              onChange={(e) => setCommentInput(e)}
              onSubmitting={handleCreateComment}
              isSubmitting={commentSubmitting}
            />
          </div>
        )}
      </div>

      {isAdmin && isShowAuditLogs && (
        <div className="border rounded p-4 flex flex-col gap-3 mt-8">
          <h3 className="font-semibold">監視ログ</h3>

          {auditLogs.length === 0 ? (
            <p className="flex flex-col gap-2">監視ログはありません</p>
          ) : (
            <div className="flex flex-col gap-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded p-3 text-sm">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(log.created_at).toLocaleString("ja-JP")}
                  </div>
                  <div>
                    実行者: {log.user_profile?.display_name ?? "不明"} (
                    {log.user_id ?? "unknown"})
                  </div>
                  <div>操作: {log.action}</div>
                  <div>対象: {log.target_type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default IssueDetailPage;
