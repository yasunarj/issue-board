"use client";

import LoadingButton from "@/app/components/LoadingButton";

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
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
      <textarea
        className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="コメントを書く"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <LoadingButton
        className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onSubmitting(issueId)}
        isLoading={isSubmitting}
        loadingText="投稿中..."
      >
        コメントを投稿
      </LoadingButton>
    </div>
  );
};

export default CommentForm;
