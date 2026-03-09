"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type ProfileRef = {
  id: string;
  role: "admin" | "member" | "viewer";
};

type Issue = {
  id: string;
  title: string;
  description: string;
  status: "open" | "resolved";
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  resolved_by: string | null;
  created_by_profile: ProfileRef | null;
  resolved_by_profile: ProfileRef | null;
};

const IssuesPage = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchIssues = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage({ text: "ログインしてください", type: "success" });
      return;
    }

    const res = await fetch("http://localhost:8787/issues", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ text: data.error ?? "取得に失敗しました", type: "error" });
    }

    setIssues(data.issues);
  }, []);

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchIssues]);

  const formReset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  const handleCreateIssue = async () => {
    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setMessage({ text: "ログインしてください", type: "error" });
        return;
      }

      const res = await fetch("http://localhost:8787/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "issueの作成に失敗しました",
          type: "error",
        });
        return;
      }

      formReset();
      setMessage({ text: "issueを作成しました", type: "success" });

      fetchIssues();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolvedIssue = async (issueId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    console.log("トークンの確認", token);

    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
      return;
    }

    const res = await fetch(
      `http://localhost:8787/issues/${issueId}/resolve`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error ?? "resolve失敗", type: "error" });
      return;
    }

    setMessage({ text: "Issueを解決しました", type: "success" });

    await fetchIssues();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Issue Board</h1>

        {message && (
          <p
            className={`mb-4 ${message.type === "error" ? "text-red-600" : "text-green-600"}`}
          >
            {message.text}
          </p>
        )}

        <div className="border rounded p-4 mb-6 flex flex-col gap-3">
          <h2 className="text-lg font-bold">Issue作成</h2>

          <input
            className="border rounded p-2"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border rounded p-2 min-h-32"
            placeholder="詳細"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            className="border rounded p-2"
            placeholder="詳細"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button
            className="bg-black border text-white rounded p-2 disabled:opacity-50"
            onClick={handleCreateIssue}
            disabled={isSubmitting}
          >
            {isSubmitting ? "作成中..." : "Issueを追加"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <p>Issueがありません</p>
          ) : (
            issues.map((issue) => (
              <div key={issue.id} className="border rounded p-4">
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

                <p className="text-sm mb-3 whitespace-pre-wrap">
                  {issue.description}
                </p>

                <div className="text-xs text-gray-600 flex flex-col gap-1">
                  <span>
                    作成者: {issue.created_by_profile?.role ?? "不明"} (
                    {issue.created_by})
                  </span>
                  <span>
                    解決者:{" "}
                    {issue.resolved_by_profile
                      ? `${issue.resolved_by_profile} (${issue.resolved_by_profile.id})`
                      : "-"}
                  </span>
                  <span>期限: {issue.due_date ?? "-"}</span>
                  <span>
                    作成日: {new Date(issue.created_at).toLocaleString("ja-jp")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default IssuesPage;
