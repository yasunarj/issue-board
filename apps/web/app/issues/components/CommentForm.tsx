"use client";

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
    <div className="flex flex-col gap-2">
      <textarea
        className="border rounded p-2 min-h-24"
        placeholder="コメントを書く"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className="bg-black text-white rounded p-2 disabled:opacity-50"
        onClick={() => onSubmitting(issueId)}
        disabled={isSubmitting}
      >
        {isSubmitting ? "投稿中" : "コメントを投稿"}
      </button>
    </div>
  );
};

export default CommentForm;
