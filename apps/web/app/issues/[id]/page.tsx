"use client";
import { useParams, useRouter } from "next/navigation";
import type { IssueDetail, IssueCheck, IssueComment, AuditLog } from "../types";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CommentList from "../components/CommentList";
import CheckSection from "../components/CheckSection";
import CommentForm from "../components/CommentForm";
import { useMe } from "@/app/hooks/useMe";
import { formatAction } from "@/app/lib/formatAction";
import { apiFetch } from "@/app/lib/api/client";

const IssueDetailPage = () => {
  const params = useParams<{ id: string }>();
  const issueId = params.id as string;
  const { me, isAdmin } = useMe();
  const canResolve = me?.role === "admin" || me?.role === "member";
  const router = useRouter();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentInputs, setCommentInputs] = useState<string>("");
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [checks, setChecks] = useState<IssueCheck[]>([]);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isShowAuditLogs, setIsShowAuditLogs] = useState<boolean>(false);

  const fetchIssue = useCallback(async () => {
    try {
      const res = await apiFetch(`/issues/${issueId}`);

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "Issueの取得に失敗しました",
          type: "error",
        });
        return;
      }

      setIssue(data.issue ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await apiFetch(`/issues/${issueId}/comments`);

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: "コメントの取得に失敗しました", type: "error" });
        return;
      }

      setComments(data.comments ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  }, [issueId]);

  const fetchChecks = useCallback(async () => {
    try {
      const res = await apiFetch(`/issues/${issueId}/checks`);

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: "確認状況の取得に失敗しました", type: "error" });
        return;
      }

      setChecks(data.checks ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  }, [issueId]);

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

  useEffect(() => {
    if (!issueId) return;
    fetchIssue();
    fetchComments();
    fetchChecks();

    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [
    fetchIssue,
    fetchComments,
    fetchChecks,
    issueId,
    fetchAuditLogs,
    isAdmin,
  ]);

  useEffect(() => {
    if (!issue) return;

    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditDueDate(issue.due_date ?? "");
  }, [issue]);

  const handleCreateComment = async () => {
    const comment = commentInputs.trim();
    if (!comment) {
      setMessage({ text: "コメントを入力してください", type: "error" });
      return;
    }

    setCommentSubmitting(true);

    try {
      const res = await apiFetch(`/issues/${issueId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "コメントの投稿に失敗しました",
          type: "error",
        });
        return;
      }

      setCommentInputs("");
      setMessage({ text: "コメントを投稿しました", type: "success" });
      await fetchComments();
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCheckIssue = async () => {
    try {
      const res = await apiFetch(`/issues/${issueId}/check`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "確認登録に失敗しました",
          type: "error",
        });
        return;
      }

      await fetchChecks();
      setCheckMessage(data.alreadyChecked ? "既に確認済です" : "確認しました");
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm("本当に削除してよろしいですか？")) return;

    try {
      const res = await apiFetch(`/issues/${issueId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "削除に失敗しました",
          type: "error",
        });
        return;
      }

      router.push("/issues");
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "削除中にエラーが発生しまいした",
        type: "error",
      });
    }
  };

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

  const handleResolvedIssue = async () => {
    try {
      const res = await apiFetch(`/issues/${issueId}/resolve`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "ステータスの更新に失敗しました",
          type: "error",
        });
        return;
      }

      setMessage({
        text:
          data.issue.status === "resolved"
            ? "Issueを解決しました"
            : "Issueを未解決に戻しました",
        type: "success",
      });

      await fetchIssue();

      if (isAdmin) {
        await fetchAuditLogs();
      }
    } catch (e) {
      setMessage({
        text:
          e instanceof Error ? e.message : "ステータスを更新できませんでした",
        type: "error",
      });
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
              {isAdmin ? (
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
              value={commentInputs}
              onChange={(e) => setCommentInputs(e)}
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
