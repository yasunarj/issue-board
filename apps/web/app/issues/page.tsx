"use client";

import { useState, useEffect, useCallback } from "react";
import type { IssueListItem } from "./types";
import { useMe } from "../hooks/useMe";
import IssueCard from "./components/IssueCard";
import IssueForm from "./components/IssueForm";
import { getAccessToken } from "../lib/api/getAccessToken";
import Link from "next/link";

const IssuesPage = () => {
  const { isAdmin } = useMe();
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      const token = await getAccessToken();

      const res = await fetch("http://localhost:8787/issues", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error ?? "取得に失敗しました", type: "error" });
        return;
      }

      const fetchedIssues = data.issues ?? [];

      const sortedIssues = [...fetchedIssues].sort((a, b) => {
        //[...]スプレット構文を使用している理由はsortは元のstateまで変えてしまうのでコピーして使用するのが良い
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setIssues(sortedIssues);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラーです";
      setMessage({ text: message, type: "error" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchIssues();
  }, [fetchIssues]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Issue Board</h1>
          {isAdmin && (
            <Link className="text-sm border rounded px-3 py-2" href="/admin/audit-logs">監査ログ</Link>
          )}
        </div>

        {message && (
          <p
            className={`mb-4 ${message.type === "error" ? "text-red-600" : "text-green-600"}`}
          >
            {message.text}
          </p>
        )}

        <IssueForm onCreatedIssue={fetchIssues} setMessage={setMessage} />

        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <p>Issueがありません</p>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="border rounded p-4 flex flex-col gap-4"
              >
                <IssueCard issue={issue} />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default IssuesPage;

// 次はsignInページを作成する