"use client";
import type { IssueCheck } from "../types";

type CheckSectionProps = {
  issueId: string;
  checks: IssueCheck[];
  onCheck: (id: string) => void;
  resultMessage: string | null;
};

const CheckSection = ({
  issueId,
  checks,
  onCheck,
  resultMessage,
}: CheckSectionProps) => {
  return (
    <div className="border-t border-slate-200 pt-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          onClick={() => onCheck(issueId)}
        >
          見ました
        </button>

        <span className="text-slate-600">確認済み: {checks.length}人</span>

        {resultMessage && (
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            {resultMessage}
          </span>
        )}
      </div>

      {checks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          {checks.map((check) => (
            <span
              key={check.user_id}
              className="rounded-full bg-slate-100 px-3 py-1"
            >
              {check.user_profile?.display_name ?? "不明"}さん
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckSection;
// 現状ではチェックした人の名前とidも表示されるのでこれはadmin権限のものだけが見れるような設定に変更する。
