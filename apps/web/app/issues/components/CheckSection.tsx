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
    <div className="border-t pt-3 text-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
          onClick={() => onCheck(issueId)}
        >
          見ました
        </button>

        <span className="text-gray-600">確認済み: {checks.length}人</span>

        {resultMessage && (
          <span className="text-green-600 text-xs">{resultMessage}</span>
        )}
      </div>

      {checks.length > 0 && (
        <div className="mt-2 text-xs text-gray-600 flex flex-col gap-1">
          {checks.map((check) => (
            <span key={check.user_id}>
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
