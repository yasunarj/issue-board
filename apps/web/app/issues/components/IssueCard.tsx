"use client";
import Link from "next/link";
import type { IssueListItem } from "../types";

type IssueCardProps = {
  issue: IssueListItem;
};

const IssueCard = ({
  issue,
}: IssueCardProps) => {
  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{issue.title}</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/issues/${issue.id}`}
              className="text-xs underline underline-offset-4"
            >
              詳細
            </Link>

            <span className="text-sm border px-2 py-1 rounded">
              {issue.status}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-2">
          コメント: {issue.comment_count ?? 0}件
        </div>


        <div className="text-xs text-gray-600 flex flex-col gap-1">
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
