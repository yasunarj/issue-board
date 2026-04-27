"use client";

import LoadingButton from "@/app/components/LoadingButton";
import { useState } from "react";
import { apiFetch } from "@/app/lib/api/client";

type CommentFormProps = {
  issueId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmitting: (id: string) => void;
  isSubmitting: boolean;
};

const CommentForm = ({
  issueId,
  value,
  onChange,
  onSubmitting,
  isSubmitting,
}: CommentFormProps) => {
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiText, setAiText] = useState<string>("");

  const handleAiFormat = async () => {
    setIsAiLoading(true);

    try {
      if (!value.trim()) {
        return;
      }

      const res = await apiFetch("/ai/format-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: value }),
      });

      const data = await res.json();

      if (!res.ok) {
        return;
      }

      setAiText(data.text);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
      <textarea
        className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="コメントを書く"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />

      {aiText && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">AI整形案</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {aiText}
          </p>

          <button
          type="button"
          className="mt-3 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => onChange(aiText)}
          >この文章を使う</button>
        </div>
      )}

      <div className="flex gap-2">
        <LoadingButton
          className="w-fit rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAiFormat}
          isLoading={isAiLoading}
          loadingText="整形中..."
        >
          AIで整える
        </LoadingButton>
        <LoadingButton
          className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onSubmitting(issueId)}
          isLoading={isSubmitting}
          loadingText="投稿中..."
        >
          コメントを投稿
        </LoadingButton>
      </div>
    </div>
  );
};

export default CommentForm;
