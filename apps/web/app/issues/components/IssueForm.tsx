"use client";

import { Dispatch, SetStateAction } from "react";

type IssueFormProps = {
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  dueDate: string;
  setDueDate: Dispatch<SetStateAction<string>>;
  onSubmitting: () => void;
  isSubmitting: boolean;
};

const IssueForm = ({ title, setTitle, description, setDescription, dueDate, setDueDate, onSubmitting, isSubmitting }: IssueFormProps) => {
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
        onClick={onSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? "作成中..." : "Issueを追加"}
      </button>
    </div>
  );
};

export default IssueForm;
