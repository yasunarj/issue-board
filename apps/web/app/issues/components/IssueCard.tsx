"use client";
import type { Issue, IssueComment } from "../types";

type IssueCardProps = {
  issue: Issue;
  handleResolvedIssue: (id: string) => void;
  commentsByIssue: Record<string, IssueComment[]>
}

const IssueCard = ({ issue, handleResolvedIssue, commentsByIssue  }: IssueCardProps) => {
  return (
    <>
      <div>
        {issue.status === "open" && (
          <button
            className="mt-3 text-sm bg-green-600 text-white px-3 py-1 rounded"
            onClick={() => handleResolvedIssue(issue.id)}
          >
            解決する
          </button>
        )}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">{issue.title}</h2>
          <span className="text-sm border px-2 py-1 rounded">
            {issue.status}
          </span>
        </div>

        <p className="text-sm mb-3 whitespace-pre-wrap">{issue.description}</p>

        <div className="text-xs text-gray-600 flex flex-col gap-1">
          <span>
            作成者: {issue.created_by_profile?.role ?? "不明"} (
            {issue.created_by})
          </span>
          <span>
            解決者:{" "}
            {issue.resolved_by_profile
              ? `${issue.resolved_by_profile.role} (${issue.resolved_by_profile.id})`
              : "-"}
          </span>
          <span>期限: {issue.due_date ?? "-"}</span>
          <span>
            作成日: {new Date(issue.created_at).toLocaleString("ja-jp")}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">コメント</h3>

        {(commentsByIssue[issue.id] ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">まだコメントはありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(commentsByIssue[issue.id] ?? []).map((comment) => (
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
    </>
  );
};

export default IssueCard;
