type IssueMailTemplateArgs = {
  notificationType: string;
  headline: string;
  issueTitle: string;
  dueDate?: string | null;
  assigneeName?: string | null;
  issueUrl: string;
  action: string;
  description?: string | null;
  createdByName?: string | null;
};

const formatValue = (value?: string | null) => value && value.trim() ? value : "未設定";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const optionalTextLine = (label: string, value?: string | null) => {
  if (!value) {
    return "";
  }

  return `${label}: ${value}`;
};

export const buildIssueMailTemplate = ({
  notificationType,
  headline,
  issueTitle,
  dueDate,
  assigneeName,
  issueUrl,
  action,
  description,
  createdByName,
}: IssueMailTemplateArgs) => {
  const details = [
    `通知種別: ${notificationType}`,
    `Issue: ${issueTitle}`,
    `期限: ${formatValue(dueDate)}`,
    optionalTextLine("担当者", assigneeName),
    optionalTextLine("作成者", createdByName),
  ].filter(Boolean);

  const text = `
${headline}

■ Issue情報
${details.join("\n")}

■ 必要な行動
${action}

■ 詳細ページ
以下のリンクからIssueの内容を確認してください。
${issueUrl}
${description ? `
■ 内容
${description}` : ""}

Issue Board
`.trim();

  const rows = [
    ["通知種別", notificationType],
    ["Issue", issueTitle],
    ["期限", formatValue(dueDate)],
    assigneeName ? ["担当者", assigneeName] : null,
    createdByName ? ["作成者", createdByName] : null,
  ].filter((row): row is string[] => row !== null);

  const htmlRows = rows.map(([label, value]) => `
        <tr>
          <th style="width: 96px; padding: 10px 12px; text-align: left; color: #555555; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${escapeHtml(label)}</th>
          <td style="padding: 10px 12px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>
  `).join("");

  const htmlDescription = description ? `
      <h2 style="margin: 24px 0 8px; font-size: 15px; color: #111827;">内容</h2>
      <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.7;">${escapeHtml(description)}</p>
  ` : "";

  const html = `
<!doctype html>
<html lang="ja">
  <body style="margin: 0; padding: 0; background: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <main style="max-width: 640px; margin: 0 auto; padding: 0;">
      <div style="padding: 24px 16px;">
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px;">${escapeHtml(notificationType)}</p>
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 20px; line-height: 1.5;">${escapeHtml(headline)}</h1>

        <h2 style="margin: 0 0 8px; font-size: 15px; color: #111827;">Issue情報</h2>
        <table role="presentation" style="width: 100%; border-collapse: collapse; border-top: 1px solid #e5e7eb;">
${htmlRows}
        </table>

        <h2 style="margin: 24px 0 8px; font-size: 15px; color: #111827;">必要な行動</h2>
        <p style="margin: 0; color: #374151; line-height: 1.7;">${escapeHtml(action)}</p>

        <h2 style="margin: 24px 0 8px; font-size: 15px; color: #111827;">詳細ページ</h2>
        <p style="margin: 0 0 12px; color: #374151; line-height: 1.7;">Issueの内容を確認し、必要に応じて更新してください。</p>
        <p style="margin: 0;">
          <a href="${escapeHtml(issueUrl)}" style="color: #1d4ed8; text-decoration: underline;">Issueの詳細を開く</a>
        </p>
${htmlDescription}

        <p style="margin: 32px 0 0; color: #6b7280; font-size: 12px;">Issue Board</p>
      </div>
    </main>
  </body>
</html>
`.trim();

  return { text, html };
};
