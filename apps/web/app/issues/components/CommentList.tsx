"use client";
import { Dispatch, SetStateAction, useState } from "react";
import type { IssueComment } from "../types";
import { useMe } from "@/app/hooks/useMe";
import { apiFetch } from "@/app/lib/api/client";
import LoadingButton from "@/app/components/LoadingButton";

type CommentListProps = {
  comments: IssueComment[];
  setMessage: Dispatch<
    SetStateAction<{ text: string; type: "error" | "success" } | null>
  >;
  fetchComments: () => void;
};

const CommentList = ({
  comments,
  setMessage,
  fetchComments,
}: CommentListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { isAdmin } = useMe();

  const handleCommentDelete = async (issueId: string, commentId: string) => {
    if (!confirm("本当に削除しても良いですか？")) return;
    setDeletingId(commentId);
    try {
      const res = await apiFetch(`/issues/${issueId}/comments/${commentId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "コメントを削除できませんでした",
          type: "error",
        });
        return;
      }

      setMessage({ text: "コメントを削除しました", type: "success" });
      await fetchComments();
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "コメントを削除できませんでした",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="border-t border-slate-200 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">コメント</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {(comments ?? []).length}件
        </span>
      </div>

      {(comments ?? []).length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          まだコメントはありません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {(comments ?? []).map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <div
                className={`mb-1 text-xs text-slate-500 ${
                  isAdmin ? "flex items-center justify-between gap-3" : ""
                }`}
              >
                投稿者: {comment.user_profile?.display_name ?? "不明"}
                {isAdmin && (
                  <LoadingButton
                    className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      handleCommentDelete(comment.issue_id, comment.id)
                    }
                    isLoading={deletingId === comment.id}
                    loadingText="削除中..."
                  >
                    削除
                  </LoadingButton>
                )}
              </div>
              <div className="mb-3 text-xs text-slate-500">
                {new Date(comment.created_at).toLocaleString("ja-JP")}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {comment.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
