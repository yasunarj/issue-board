"use client";

import {  Dispatch, SetStateAction, useState } from "react";
import { apiFetch } from "@/app/lib/api/client";

type IssueForm = {
  onCreatedIssue: () => Promise<void>;
  setMessage: Dispatch<SetStateAction<{text: string; type: "success" | "error" } | null>>
}

const IssueForm = ({onCreatedIssue, setMessage}: IssueForm) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formReset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
  };
  
  const handleCreateIssue = async () => {
    setIsSubmitting(true);
  
    try {
      const res = await apiFetch("/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  
      await onCreatedIssue();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Issue作成</h2>
        <p className="mt-1 text-sm text-slate-500">
          対応が必要な内容を登録してください
        </p>
      </div>

      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="詳細"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="date"
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="詳細"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <button
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleCreateIssue}
        disabled={isSubmitting}
      >
        {isSubmitting ? "作成中..." : "Issueを追加"}
      </button>
    </div>
  );
};

export default IssueForm;
