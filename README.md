# Issue Board

店舗で発生した問題点を登録し、関係者で情報共有しながら、解決策の検討・実行・完了までの流れを管理するためのアプリです。

## 概要

Issue Board は、店舗運営の中で発生した課題や問題点を記録し、対応状況を可視化するための社内向けアプリです。

問題の登録だけで終わらず、次の流れを一貫してサポートします。

- 問題点を Issue として登録する
- コメントで状況や対応案を共有する
- 誰が確認したかを記録する
- 対応完了後に解決済みにする
- 操作履歴を監査ログとして残す

## 主な機能

- ログイン / ユーザー登録
- Issue の作成
- Issue 一覧表示
- Issue 詳細表示
- コメント投稿
- 確認チェック（見ました）
- Issue の解決 / 未解決切り替え
- Issue の編集 / 削除
- 監査ログの記録 / 閲覧
- メール通知
- ロールによる権限制御

## 想定利用シーン

- 店舗で発生したトラブルの共有
- 設備やオペレーション上の改善点の記録
- 対応漏れの防止
- 誰が確認・対応したかの可視化
- 過去の対応履歴の振り返り

## 技術構成

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase JavaScript Client

### Backend
- Hono
- TypeScript
- Supabase
- Zod
- Nodemailer

## 権限
ロールごとに利用できる機能が異なります。

### admin
- Issue 一覧/詳細閲覧
- Issue 作成
- Issue 編集
- Issue 削除
- Issue 解決/未解決切り替え
- コメント投稿
- コメント削除
- 確認チェック
- 監視ログ閲覧

### member
- Issue 一覧/詳細閲覧
- Issue 作成
- コメント投稿
- Issue 解決/未解決切り替え
- 確認チェック

### viewer
- Issue 一覧/詳細閲覧
- コメント閲覧
- 確認チェック

## 画面一覧
- /
  - ログイン画面
- /register
  - 新規登録画面
- /issues/[id]
  - Issue 詳細画面
- /admin/audit-logs
  - 監視ログ画面

## API概要

### 共通
- GET /health
- GET /me

### Issues
- GET /issues
- POST /issues
- GET /issues/:id
- PATCH /issues/:id
- DELETE /issues/:id
- PATCH /issues/:id/resolve

### Comments
- GET /issues/:id/comments
- POST /issues/:id/comments
- DELETE /issues/:issueId/comments/:commentId

### Checks
- GET /issues/:id/audit-logs
- 別途、全体監視ログ取得用ルートあり

## バリデーション


