"use client";
import { useParams } from "next/navigation";
import type { Issue } from "../types";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

const IssueDetailPage = () => {
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchIssue = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setMessage({ text: "ログインしてください", type: "error" });
      }

      const res = await fetch(`http://localhost:8787/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "Issueの取得に失敗しました",
          type: "error",
        });
        return;
      }

      setIssue(data.issue ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    if (!issueId) return;
    fetchIssue();
  }, [fetchIssue, issueId]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <div className="flex item-center justify-between">
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
              <span className="text-sm border px-2 py-1 rounded">
                {issue.status}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm">{issue.description}</p>

            <div className="text-xs text-gray-600 flex flex-col gap-1">
              <span>
                作成者: {issue.created_by_profile?.role ?? "不明"}{" "}
                (issue.created_by)
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
          </div>
        )}
      </div>
    </main>
  );
};

export default IssueDetailPage;
