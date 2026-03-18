"use client";
import { useParams } from "next/navigation";
import type { IssueDetail, IssueCheck, IssueComment } from "../types";
import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/app/lib/api/getAccessToken";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import CommentList from "../components/CommentList";
import CheckSection from "../components/CheckSection";
import CommentForm from "../components/CommentForm";

const IssueDetailPage = () => {
  const params = useParams<{ id: string }>();
  const issueId = params.id as string;
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentInputs, setCommentInputs] = useState<string>("");
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [checks, setChecks] = useState<IssueCheck[]>([]);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const fetchIssue = useCallback(async () => {
    try {
      const token = await getAccessToken();

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
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  const fetchComments = useCallback(async () => {
    try {
      const token = await getAccessToken();

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
        setMessage({ text: "コメントの取得に失敗しました", type: "error" });
        return;
      }

      setComments(data.comments ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  }, [issueId]);

  const fetchChecks = useCallback(async () => {
    try {
      const token = await getAccessToken();

      const res = await fetch(
        `http://localhost:8787/issues/${issueId}/checks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: "確認状況の取得に失敗しました", type: "error" });
        return;
      }

      setChecks(data.checks ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  }, [issueId]);

  useEffect(() => {
    if (!issueId) return;
    fetchIssue();
    fetchComments();
    fetchChecks();
  }, [fetchIssue, fetchComments, fetchChecks, issueId]);

  const handleCreateComment = async () => {
    const comment = commentInputs.trim();
    if (!comment) {
      setMessage({ text: "コメントを入力してください", type: "error" });
      return;
    }

    setCommentSubmitting(true);

    try {
      const token = await getAccessToken();

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

      setCommentInputs("");
      setMessage({ text: "コメントを投稿しました", type: "success" });
      await fetchComments();
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCheckIssue = async () => {
    try {
      const token = await getAccessToken();

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

      await fetchChecks();
      setCheckMessage(data.alreadyChecked ? "既に確認済です" : "確認しました");
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラー";
      setMessage({ text: message, type: "error" });
    }
  };

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
                作成者: {issue.created_by_profile?.role ?? "不明"} (
                {issue.created_by})
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

            <CommentList comments={comments} />
            <CheckSection
              issueId={issueId}
              checks={checks ?? []}
              onCheck={handleCheckIssue}
              resultMessage={checkMessage ?? null}
            />
            <CommentForm
              issueId={issueId}
              value={commentInputs}
              onChange={(e) => setCommentInputs(e)}
              onSubmitting={handleCreateComment}
              isSubmitting={commentSubmitting}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default IssueDetailPage;
