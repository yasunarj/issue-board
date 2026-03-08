"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type Issue = {
  id: string;
  title: string;
  description: string;
  status: "open" | "resolve";
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  resolved_by: string | null;
};

const IssuesPage = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchIssue = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setMessage("ログインしてください");
        return;
      }

      const res = await fetch("http://localhost:8787/issues", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();


      if (!res.ok) {
        setMessage(data.error ?? "取得に失敗しました");
        return;
      }

      setIssues(data.issues);
    };

    fetchIssue();
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Issue Board</h1>

        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <p>Issueがありません</p>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold">{issue.title}</h2>
                  <span className="text-sm border px-2 py-1 rounded">
                    {issue.status}
                  </span>
                </div>

                <p className="text-sm mb-3 whitespace-pre-wrap">
                  {issue.description}
                </p>

                <div className="text-xs text-gray-600 flex flex-col gap-1">
                  <span>作成者ID: {issue.created_by}</span>
                  <span>解決者ID: {issue.resolved_by}</span>
                  <span>期限: {issue.due_date ?? "-"}</span>
                  <span>作成日: {new Date(issue.created_at).toLocaleString("ja-jp")}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {message && <p className="mb-4 text-red-600">{message}</p>}
      </div>
    </main>
  );
};

export default IssuesPage;
