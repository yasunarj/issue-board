"use client";
import Link from "next/link";
import type { IssueListItem } from "../types";

type IssueCardProps = {
  issue: IssueListItem;
};

const IssueCard = ({
  issue,
}: IssueCardProps) => {
  const isResolved = issue.status === "resolved";

  return (
    <>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {issue.title}
            </h2>
            <div className="mt-2 text-sm text-slate-500">
              コメント: {issue.comment_count ?? 0}件
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/issues/${issue.id}`}
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              詳細
            </Link>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isResolved
                  ? "bg-slate-100 text-slate-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {isResolved ? "resolved" : "open"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-3">
          <span>
            作成者: {issue.created_by_profile?.display_name ?? "不明"}
          </span>
          <span>期限: {issue.due_date ?? "-"}</span>
          <span>
            作成日: {new Date(issue.created_at).toLocaleString("ja-jp")}
          </span>
        </div>
      </div>
    </>
  );
};

export default IssueCard;
