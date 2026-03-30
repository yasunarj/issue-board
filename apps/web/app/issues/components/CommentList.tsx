"use client";
import { Dispatch, SetStateAction, useState } from "react";
import type { IssueComment } from "../types";
import { useMe } from "@/app/hooks/useMe";
import { apiFetch } from "@/app/lib/api/client";

type CommentListProps = {
  comments: IssueComment[];
  setMessage: Dispatch<
    SetStateAction<{ text: string; type: "error" | "success" } | null>
  >;
  fetchComments: () => void;
};

const CommentList = ({ comments, setMessage, fetchComments }: CommentListProps) => {
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
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-2">コメント</h3>

      {(comments ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">まだコメントはありません</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="border rounded p-3 bg-gray-900">
              <div
                className={`text-xs text-gray-600 mb-1 ${isAdmin ? "flex justify-between" : ""}`}
              >
                投稿者: {comment.user_profile?.display_name ?? "不明"}
                {isAdmin && (
                  <button
                    className="border rounded px-2 py-1 text-white text-xs"
                    onClick={() =>
                      handleCommentDelete(comment.issue_id, comment.id)
                    }
                    disabled={deletingId === comment.id}
                  >
                    {deletingId === comment.id ? "削除中" : "削除"}
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {new Date(comment.created_at).toLocaleString("ja-JP")}
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
