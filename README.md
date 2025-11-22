# DICOM Batch Uploader

Google Cloud Healthcare APIのDICOM StoreにDICOMファイルをバッチアップロードし、メタデータを管理するNext.jsアプリケーションです。

## 機能

### 現在実装済み（Phase 1）
- ✅ Google OAuth認証システム
- ✅ ユーザー管理（管理者承認制）
- ✅ ロールベース認証（管理者/ユーザー/承認待ち）
- ✅ 管理者ページ（ユーザー承認・ロール管理）
- ✅ ダッシュボード（統計表示）
- ✅ DICOMパーサー（dcmjs）
- ✅ Healthcare API クライアント

### 実装予定（Phase 2-3）
- 🔄 ファイルアップロードUI（ドラッグ&ドロップ）
- 🔄 メタデータ表示・編集機能
- 🔄 バッチアップロード機能（最大50ファイル）
- 🔄 進捗表示・エラーハンドリング
- 🔄 データ閲覧・検索機能
- 🔄 CSVエクスポート機能
- 🔄 自動データ削除（保持期間: 90日）

## 技術スタック

- **フロントエンド**: Next.js 14, React, TailwindCSS
- **認証**: NextAuth.js (Google OAuth)
- **データベース**: PostgreSQL (Prisma ORM)
- **DICOM処理**: dcmjs, dicom-parser
- **Healthcare API**: Google Cloud Healthcare API
- **その他**: axios, p-queue, papaparse, zustand

## 必要な環境

- Node.js 18以上
- PostgreSQL データベース
- Google Cloud Platform アカウント
- Google Cloud Healthcare APIが有効化されたプロジェクト
- Google OAuth クライアント ID/Secret

## セットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd dicom-batch-uploader
npm install
```

### 2. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dicom_uploader?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32で生成>"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Cloud Healthcare API
GOOGLE_APPLICATION_CREDENTIALS="./.credentials.json"
GCP_PROJECT_ID="your-project-id"
GCP_LOCATION="us-central1"
GCP_DATASET_ID="your-dataset-id"
GCP_DICOM_STORE_ID="your-dicom-store-id"

# Cron Secret
CRON_SECRET="<openssl rand -base64 32で生成>"

# データ保持期間（日数）
DATA_RETENTION_DAYS="90"
```

### 3. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIs & Services** → **Credentials** に移動
3. **Create Credentials** → **OAuth 2.0 Client ID** を選択
4. **Application type**: Web application
5. **Authorized redirect URIs** に以下を追加:
   - `http://localhost:3000/api/auth/callback/google` (開発環境)
   - `https://your-domain.vercel.app/api/auth/callback/google` (本番環境)
6. Client ID と Client Secret を `.env` に設定

### 4. Google Cloud Healthcare API設定

#### DICOM Store の作成

```bash
# データセット作成
gcloud healthcare datasets create DATASET_ID \
  --location=us-central1

# DICOM Store 作成
gcloud healthcare dicom-stores create DICOM_STORE_ID \
  --dataset=DATASET_ID \
  --location=us-central1

# サービスアカウントに権限付与
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/healthcare.dicomEditor"
```

#### サービスアカウントキーの設置

1. Google Cloud Consoleでサービスアカウントキー（JSON）をダウンロード
2. プロジェクトルートに `.credentials.json` として保存

### 5. データベースのセットアップ

```bash
# Prisma マイグレーション実行
npx prisma migrate dev

# Prisma Client生成
npx prisma generate
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 7. 初期管理者の作成

初回ログイン後、データベースで直接管理者権限を付与してください：

```sql
-- PostgreSQLで実行
UPDATE users 
SET role = 'admin', approved_at = NOW() 
WHERE email = 'your-email@example.com';
```

その後、管理者アカウントで再ログインしてください。

## 使用方法

### 管理者の場合

1. `/auth/signin` からGoogle アカウントでログイン
2. `/admin` ページで新規ユーザーの承認・管理
3. ユーザーのロール変更・削除が可能

### ユーザーの場合

1. `/auth/signin` からGoogle アカウントでログイン
2. 管理者の承認を待つ（承認待ちページが表示されます）
3. 承認後、ダッシュボードにアクセス可能

### データのアップロード（実装予定）

1. `/upload` ページにアクセス
2. DICOMファイルをドラッグ&ドロップ
3. メタデータを確認・編集
4. アップロード実行

## プロジェクト構造

```
dicom-batch-uploader/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].js      # NextAuth設定
│   │   ├── admin/
│   │   │   └── users.js               # ユーザー管理API
│   │   └── dashboard/
│   │       └── stats.js               # ダッシュボード統計API
│   ├── auth/
│   │   ├── signin.js                  # ログインページ
│   │   ├── pending.js                 # 承認待ちページ
│   │   └── error.js                   # エラーページ
│   ├── _app.js                        # Next.jsアプリ設定
│   ├── index.js                       # ダッシュボード
│   ├── admin.js                       # 管理者ページ
│   ├── upload.js                      # アップロードページ（実装予定）
│   └── browse.js                      # データ閲覧ページ（実装予定）
├── components/
│   ├── Navbar.js                      # ナビゲーションバー
│   └── Layout.js                      # レイアウトコンポーネント
├── lib/
│   ├── prisma.js                      # Prismaクライアント
│   ├── healthcare-api.js              # Healthcare API クライアント
│   └── dicom-parser.js                # DICOMパーサー
├── prisma/
│   └── schema.prisma                  # データベーススキーマ
├── .env                               # 環境変数（gitignore対象）
├── .credentials.json                  # GCPサービスアカウント（gitignore対象）
└── README.md
```

## データベーススキーマ

### users
ユーザー情報を管理

### accounts / sessions / verification_tokens
NextAuth.jsが使用する認証テーブル

### upload_batches
アップロードバッチ（アップロードセッション）を管理

### dicom_instances
個々のDICOMインスタンスとメタデータを管理

### metadata_edits
メタデータ編集履歴を記録

## Vercel デプロイ

### 1. Vercel プロジェクト作成

```bash
npm i -g vercel
vercel login
vercel
```

### 2. Vercel Postgres 設定

1. Vercel ダッシュボードで **Storage** タブに移動
2. **Create Database** → **Postgres** を選択
3. 自動的に `DATABASE_URL` 環境変数が設定されます

### 3. 環境変数設定

Vercel ダッシュボードで以下の環境変数を設定：

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GCP_PROJECT_ID`
- `GCP_LOCATION`
- `GCP_DATASET_ID`
- `GCP_DICOM_STORE_ID`
- `CRON_SECRET`
- `DATA_RETENTION_DAYS`

**注意**: `GOOGLE_APPLICATION_CREDENTIALS` は環境変数として設定できないため、サービスアカウントキーのJSON内容を別の方法で読み込む必要があります。

### 4. マイグレーション実行

```bash
npx prisma migrate deploy
```

### 5. デプロイ

```bash
vercel --prod
```

## トラブルシューティング

### データベース接続エラー

- `DATABASE_URL` が正しく設定されているか確認
- PostgreSQL サーバーが起動しているか確認

### 認証エラー

- Google OAuth の Redirect URI が正しく設定されているか確認
- `NEXTAUTH_SECRET` が設定されているか確認

### Healthcare API エラー

- サービスアカウントに適切な権限が付与されているか確認
- DICOM Store のリソース名が正しいか確認

## 今後の開発予定

- [x] 認証システム（Week 1完了）
- [ ] アップロード機能（Week 2-3）
- [ ] データ閲覧・検索機能（Week 3）
- [ ] CSVエクスポート機能（Week 3）
- [ ] 自動データ削除機能（Week 4）
- [ ] パフォーマンス最適化（Phase 4）
- [ ] ビューア統合（Phase 5）

## ライセンス

MIT
