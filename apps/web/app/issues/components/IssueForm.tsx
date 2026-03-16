"use client";

import { supabase } from "@/lib/supabase/client";
import {  Dispatch, SetStateAction, useState } from "react";

type IssueForm = {
  onCreatedIssue: () => void;
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
  
      onCreatedIssue();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
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
  );
};

export default IssueForm;


