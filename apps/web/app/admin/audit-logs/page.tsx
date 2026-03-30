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
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <Link href="/issues">一覧へ戻る</Link>
        </div>
        {message && (
          <p
            className={`mb-4 ${message.type === "error" ? "text-red-600" : "text-green-600"}`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p>読み込み中...</p>
          ) : logs.length === 0 ? (
            <div>ログがありません</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border p-3 rounded">
                <div>{new Date(log.created_at).toLocaleString()}</div>
                <div>{log.user_profile?.display_name ?? "不明"}</div>
                <div>{formatAction(log.action)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default AuditLogPage;
