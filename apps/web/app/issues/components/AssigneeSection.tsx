"use client";

import { IssueCheck } from "../types";
import LoadingButton from "@/app/components/LoadingButton";

type AssigneeSectionProps = {
  currentAssigneeName: string | null;
  selectedAssignee: string;
  setSelectedAssignee: (value: string) => void;
  onAssignee: () => void;
  checks: IssueCheck[];
  isUpdatingAssignee: boolean;
};

const AssigneeSection = ({
  currentAssigneeName,
  selectedAssignee,
  setSelectedAssignee,
  onAssignee,
  checks,
  isUpdatingAssignee,
}: AssigneeSectionProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">解決担当者</h3>
        <span className="text-xs text-slate-500">
          現在: {currentAssigneeName ?? "未設定"}
        </span>
      </div>

      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        value={selectedAssignee}
        onChange={(e) => setSelectedAssignee(e.target.value)}
        disabled={isUpdatingAssignee || checks.length === 0}
      >
        <option value="">選択してください</option>
        {checks.map((check) => (
          <option key={check.id} value={check.user_id}>
            {check.user_profile?.display_name ?? "不明"}
          </option>
        ))}
      </select>

      <div className="flex justify-end">
        <LoadingButton
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          onClick={onAssignee}
          disabled={!selectedAssignee}
          isLoading={isUpdatingAssignee}
          loadingText="更新中..."
        >
          担当者を決定
        </LoadingButton>
      </div>
    </div>
  );
};

export default AssigneeSection;
