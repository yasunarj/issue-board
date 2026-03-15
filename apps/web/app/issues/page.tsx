"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Issue, IssueCheck, IssueComment } from "./types";
import CommentForm from "./components/CommentForm";
import IssueCard from "./components/IssueCard";
import IssueForm from "./components/IssueForm";
import CheckSection from "./components/CheckSection";

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
  const [commentsByIssue, setCommentsByIssue] = useState<
    Record<string, IssueComment[]>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [commentLoadingByIssue, setCommentLoadingByIssue] = useState<
    Record<string, boolean>
  >({});
  const [checksByIssue, setChecksByIssue] = useState<
    Record<string, IssueCheck[]>
  >({});
  const [checkMessageByIssue, setCheckMessageByIssue] = useState<
    Record<string, string>
  >({});

  const fetchChecks = useCallback(async (issueId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
      return;
    }

    const res = await fetch(`http://localhost:8787/issues/${issueId}/checks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({
        text: data.error ?? "確認状況の取得に失敗しました",
        type: "error",
      });
      return;
    }

    setChecksByIssue((prev) => ({
      ...prev,
      [issueId]: data.checks ?? [],
    }));
  }, []);

  const fetchComments = useCallback(async (issueId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
      return;
    }

    const res = await fetch(
      `http://localhost:8787/issues/${issueId}/comments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    if (!res.ok) {
      setMessage({
        text: data.error ?? "コメントの取得に失敗しました",
        type: "error",
      });
      return;
    }

    setCommentsByIssue((prev) => ({
      ...prev,
      [issueId]: data.comments ?? [],
    }));
  }, []);

  const fetchIssues = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    console.log(token);
    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
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
      return;
    }

    const fetchedIssues = data.issues ?? [];
    setIssues(fetchedIssues);

    for (const issue of fetchedIssues) {
      await fetchComments(issue.id);
      await fetchChecks(issue.id);
    }
  }, [fetchComments, fetchChecks]);

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

      await fetchIssues();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolvedIssue = async (issueId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
      return;
    }

    const res = await fetch(`http://localhost:8787/issues/${issueId}/resolve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error ?? "resolve失敗", type: "error" });
      return;
    }

    setMessage({ text: "Issueを解決しました", type: "success" });

    await fetchIssues();
  };

  const handleCreateComment = async (issueId: string) => {
    const comment = commentInputs[issueId]?.trim() ?? "";
    if (!comment) {
      setMessage({ text: "コメントを入力してください", type: "error" });
      return;
    }

    setCommentLoadingByIssue((prev) => ({
      ...prev,
      [issueId]: true,
    }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessage({ text: "ログインしてください", type: "error" });
        return;
      }

      const res = await fetch(
        `http://localhost:8787/issues/${issueId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "コメントの投稿に失敗しました",
          type: "error",
        });
        return;
      }

      setCommentInputs((prev) => ({
        ...prev,
        [issueId]: "",
      }));

      await fetchComments(issueId);
      setMessage({ text: "コメントを投稿しました", type: "success" });
    } finally {
      setCommentLoadingByIssue((prev) => ({
        ...prev,
        [issueId]: false,
      }));
    }
  };

  const handleCheckIssue = async (issueId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMessage({ text: "ログインしてください", type: "error" });
      return;
    }

    const res = await fetch(`http://localhost:8787/issues/${issueId}/check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({
        text: data.error ?? "確認登録に失敗しました",
        type: "error",
      });
      return;
    }

    await fetchChecks(issueId);

    if (data.alreadyChecked) {
      setCheckMessageByIssue((prev) => ({
        ...prev,
        [issueId]: "すでに確認済です",
      }));
    } else {
      setCheckMessageByIssue((prev) => ({
        ...prev,
        [issueId]: "確認しました",
      }));
    }
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

        <IssueForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          dueDate={dueDate}
          setDueDate={setDueDate}
          onSubmitting={handleCreateIssue}
          isSubmitting={isSubmitting}
        />

        <div className="flex flex-col gap-4">
          {issues.length === 0 ? (
            <p>Issueがありません</p>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="border rounded p-4 flex flex-col gap-4"
              >
                <IssueCard
                  issue={issue}
                  handleResolvedIssue={handleResolvedIssue}
                  commentsByIssue={commentsByIssue}
                />

                <CheckSection
                  issueId={issue.id}
                  checks={checksByIssue[issue.id] ?? []}
                  onCheck={handleCheckIssue}
                  resultMessage={checkMessageByIssue[issue.id] ?? null}
                />

                <CommentForm
                  issueId={issue.id}
                  value={commentInputs[issue.id]}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({ ...prev, [issue.id]: e }))
                  }
                  onSubmitting={handleCreateComment}
                  isSubmitting={commentLoadingByIssue[issue.id] ?? false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default IssuesPage;
