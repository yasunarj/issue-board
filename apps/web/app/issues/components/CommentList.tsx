"use client";
import type { IssueComment } from "../types";

type CommentListProps = {
  comments: IssueComment[]
}

const CommentList = ({ comments }: CommentListProps) => {
  return (
    <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">コメント</h3>

        {(comments ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">まだコメントはありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(comments ?? []).map((comment) => (
              <div key={comment.id} className="border rounded p-3 bg-gray-900">
                <div className="text-xs text-gray-600 mb-1">
                  投稿者: {comment.user_profile?.role ?? "不明"} (
                  {comment.user_id})
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