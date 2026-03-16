"use client";
import Link from "next/link";
import type { Issue } from "../types";

type IssueCardProps = {
  issue: Issue;
};

const IssueCard = ({
  issue,
}: IssueCardProps) => {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
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
    </>
  );
};

export default IssueCard;
