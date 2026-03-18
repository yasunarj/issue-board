This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# issue-borad


<!-- 開発用 -->
curl -X GET "http://localhost:8787/issues/21db1ca0-28c0-448e-8927-b7ee7e79b29e" \
  -H "Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjZjYTllZjM0LWVmNzQtNDBiNi04YWUxLTEwZDBmMGE2ZmEzOSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3VycHZqZWRna3pueXVnbG5jbWh1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YWRkMGQ0MS03ZjgyLTQzN2YtODhhYi0zMzU1NDU4NGU1Y2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzczNTcwMTQwLCJpYXQiOjE3NzM1NjY1NDAsImVtYWlsIjoieWFzdW5hcmpAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzI5NTIyNjB9XSwic2Vzc2lvbl9pZCI6ImVjYWY5Y2NiLTRlNGItNGYxZC1hODdiLWYyNTJkNTZkMzVmZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.ReaUHg5ti3kxfVOgkzvoKX0_Y1Mkx5oKSiSpOWPG1tHvdVSiM5082Sn6KxFVr9GEpMYHbcUDEe8ykUbSzDdRLQ"

git fetch --all --prune
git push origin --delete feature/...
git merge feature/...
git checkout -b ...


・解決すみのIssueは別枠へ移動させる。完了ページの作成
・実装が終わったら、のちにAI機能を搭載させる。
https://chatgpt.com/c/69aeaad5-1ee0-83a5-87e6-ff8d8e451ae1
・登録したユーザーが何人いるのかを一覧で確認できるようにする。(issue_checkがあるので誰が見たのかを確認できると良い)
・admin のみ確認者一覧の詳細を表示する
  -そのために/me取得と role 判定を追加する
  -将来的には profiles.display_name を追加して名前表示にしたい
・一覧のところにコメントが何件あるかを確認できるようにしたい