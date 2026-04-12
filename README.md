This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Web Environment Variables

The web app expects the following value in `apps/web/.env.local`.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

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


# issues routes 観点表

## PATCH /issues/:id/resolve
- [x] open → resolved 成功
- [x] resolved → open 成功
- [x] issue not found → 404
- [x] update失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## DELETE /issues/:id
- [x] admin は削除成功
- [x] member/viewer は 403
- [x] issue not found → 404
- [x] delete失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## PATCH /issues/:id
- [x] admin は更新成功
- [x] member/viewer は 403
- [x] issue not found → 404
- [x] update失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## POST /issues
- [x] admin は作成成功
- [x] member は作成成功
- [x] viewer は 403
- [x] title 空 → 400
- [x] insert失敗 → 500
- [x] sendMail失敗でも 201
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## POST /issues/:id/comments
- [x] member は作成成功
- [x] viewer は 403
- [x] issue not found → 404
- [x] comment 空 → 400
- [x] insert失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## GET /issues/:id/comments
- [x] member は取得成功
- [x] viewer は取得成功
- [x] issue not found → 404
- [x] 取得失敗 → 500

## DELETE /issues/:issueId/comments/:commentId
- [x] admin は削除成功
- [x] member/viewer は 403
- [x] comment not found → 404
- [x] delete失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない

## GET /issues/:id/checks
- [x] member は取得成功
- [x] viewer は取得成功
- [x] issue not found → 404
- [x] 取得失敗 → 500

## POST /issues/:id/check
- [x] member はcheck成功
- [x] viewer はcheck成功
- [x] issue not found → 404
- [x] existing check 確認失敗 → 500
- [x] 既にcheck済み → 200
- [x] check作成失敗 → 500
- [x] 成功時 auditLog が呼ばれる
- [x] 失敗時 auditLog は呼ばれない