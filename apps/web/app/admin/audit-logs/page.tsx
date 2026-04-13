"use client";

import type { AuditLog } from "@/app/issues/types";
import { useCallback, useEffect, useState } from "react";
import { formatAction } from "@/app/lib/formatAction";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api/client";

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/audit-logs");

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          text: data.error ?? "ログの取得に失敗しました",
          type: "error",
        });
        return;
      }

      setLogs(data.logs);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラーです";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-blue-700">管理者</p>
            <h1 className="mt-1 text-3xl font-bold">Audit Logs</h1>
          </div>
          <Link
            href="/issues"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          >
            一覧へ戻る
          </Link>
        </div>
        {message && (
          <p
            className={`mb-4 rounded-md border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              読み込み中...
            </p>
          ) : logs.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              ログがありません
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-md border border-slate-200 bg-white p-5 text-sm shadow-sm"
              >
                <div className="mb-2 text-xs text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="font-medium text-slate-900">
                  {log.user_profile?.display_name ?? "不明"}
                </div>
                <div className="mt-2 text-slate-700">
                  {formatAction(log.action)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default AuditLogPage;
