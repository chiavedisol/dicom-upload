# セットアップガイド

このガイドでは、DICOM Batch Uploaderのローカル開発環境とVercel本番環境のセットアップ方法を説明します。

## 目次

1. [前提条件](#前提条件)
2. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
3. [Google Cloud設定](#google-cloud設定)
4. [Vercelデプロイ](#vercelデプロイ)
5. [トラブルシューティング](#トラブルシューティング)

## 前提条件

以下のツールがインストールされていることを確認してください：

- **Node.js** 18以上
- **npm** または **yarn**
- **PostgreSQL** 14以上（ローカル開発用）
- **Google Cloud SDK** (gcloud CLI)
- **Git**

## ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd dicom-batch-uploader
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```bash
# Database
# ローカルPostgreSQLの接続URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/dicom_uploader?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
# 以下のコマンドで生成: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (後で設定)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Google Cloud Healthcare API
GOOGLE_APPLICATION_CREDENTIALS="./.credentials.json"
GCP_PROJECT_ID="your-project-id"
GCP_LOCATION="us-central1"
GCP_DATASET_ID="your-dataset-id"
GCP_DICOM_STORE_ID="your-dicom-store-id"

# Cron Secret
CRON_SECRET="your-cron-secret"

# データ保持期間（日数）
DATA_RETENTION_DAYS="90"

# Public環境変数（クライアントサイドで使用）
NEXT_PUBLIC_DATA_RETENTION_DAYS="90"
```

### 4. PostgreSQLデータベースの準備

#### PostgreSQLのインストール（Windowsの場合）

1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストール時にパスワードを設定
3. pgAdminを使用してデータベースを作成：
   ```sql
   CREATE DATABASE dicom_uploader;
   ```

#### 接続URLの確認

`.env` ファイルの `DATABASE_URL` を確認：
```
postgresql://ユーザー名:パスワード@localhost:5432/dicom_uploader
```

### 5. Prismaマイグレーション

```bash
# Prisma Clientを生成
npx prisma generate

# マイグレーションを実行
npx prisma migrate dev --name init

# 確認
npx prisma studio
```

`prisma studio` でブラウザが開き、データベースの中身を確認できます。

## Google Cloud設定

### 1. Google Cloudプロジェクトの作成

```bash
# gcloud CLIにログイン
gcloud auth login

# プロジェクト作成
gcloud projects create YOUR_PROJECT_ID

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID
```

### 2. Healthcare APIの有効化

```bash
# Healthcare APIを有効化
gcloud services enable healthcare.googleapis.com
```

### 3. DICOM Storeの作成

```bash
# データセット作成
gcloud healthcare datasets create my-dataset \
  --location=us-central1

# DICOM Store作成
gcloud healthcare dicom-stores create my-dicom-store \
  --dataset=my-dataset \
  --location=us-central1
```

### 4. サービスアカウントの作成と権限付与

```bash
# サービスアカウント作成
gcloud iam service-accounts create dicom-uploader \
  --display-name="DICOM Uploader Service Account"

# Healthcare DICOM Editor権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:dicom-uploader@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/healthcare.dicomEditor"

# サービスアカウントキーを作成
gcloud iam service-accounts keys create .credentials.json \
  --iam-account=dicom-uploader@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

作成された `.credentials.json` をプロジェクトルートに配置してください。

### 5. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIとサービス** → **認証情報** に移動
3. **認証情報を作成** → **OAuth 2.0 クライアントID** を選択
4. アプリケーションの種類: **ウェブアプリケーション**
5. **承認済みのリダイレクトURI** に以下を追加:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google` (本番環境)
6. 作成後、**クライアントID** と **クライアントシークレット** を `.env` に設定

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 初期管理者の作成

1. Googleアカウントでログイン（初回は承認待ち状態になります）
2. データベースで直接管理者権限を付与：

```sql
UPDATE users 
SET role = 'admin', approved_at = NOW() 
WHERE email = 'your-email@example.com';
```

または、Prisma Studioを使用：

```bash
npx prisma studio
```

3. 再ログインして管理者としてアクセス

## Vercelデプロイ

### 1. Vercel CLIのインストール

```bash
npm i -g vercel
```

### 2. Vercelにログイン

```bash
vercel login
```

### 3. Vercel Postgresの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. **Storage** タブに移動
3. **Create Database** → **Postgres** を選択
4. データベース名を入力して作成
5. 自動的に `DATABASE_URL` 環境変数が設定されます

### 4. 環境変数の設定

Vercel Dashboardの **Settings** → **Environment Variables** で以下を設定：

- `NEXTAUTH_URL` (本番URLを設定)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GCP_PROJECT_ID`
- `GCP_LOCATION`
- `GCP_DATASET_ID`
- `GCP_DICOM_STORE_ID`
- `CRON_SECRET`
- `DATA_RETENTION_DAYS`
- `NEXT_PUBLIC_DATA_RETENTION_DAYS`

**重要**: `GOOGLE_APPLICATION_CREDENTIALS` は環境変数として設定できません。代わりに以下の方法を使用：

1. `.credentials.json` の内容を環境変数 `GOOGLE_CREDENTIALS` としてJSON文字列で設定
2. `lib/healthcare-api.js` を修正して環境変数から読み込むように変更

### 5. デプロイ

```bash
# プロジェクトをリンク
vercel

# 本番環境にデプロイ
vercel --prod
```

### 6. マイグレーション実行

デプロイ後、Vercel Postgresにマイグレーションを適用：

```bash
# Vercelの環境変数を使用
npx prisma migrate deploy
```

## トラブルシューティング

### データベース接続エラー

**エラー**: `Can't reach database server`

**解決策**:
1. PostgreSQLが起動しているか確認
2. `.env` の `DATABASE_URL` が正しいか確認
3. ファイアウォールでPostgreSQLのポート（5432）が開いているか確認

### Prismaマイグレーションエラー

**エラー**: `Migration failed`

**解決策**:
```bash
# マイグレーションをリセット
npx prisma migrate reset

# 再度マイグレーション
npx prisma migrate dev
```

### Google OAuth エラー

**エラー**: `redirect_uri_mismatch`

**解決策**:
1. Google Cloud Consoleで設定したリダイレクトURIを確認
2. `http://localhost:3000/api/auth/callback/google` が正しく設定されているか確認
3. URLに余分なスペースや改行がないか確認

### Healthcare API エラー

**エラー**: `Permission denied` または `403 Forbidden`

**解決策**:
1. サービスアカウントに `roles/healthcare.dicomEditor` が付与されているか確認
2. Healthcare APIが有効化されているか確認
3. DICOM Storeのリソース名が正しいか確認

```bash
# 権限を確認
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:dicom-uploader@*"
```

### Vercel Cron実行エラー

**エラー**: Cronジョブが実行されない

**解決策**:
1. `vercel.json` が正しく設定されているか確認
2. Vercel Proプラン以上が必要（Cronは有料機能）
3. ログを確認: Vercel Dashboard → Functions → Logs

## 便利なコマンド

```bash
# 開発サーバー起動
npm run dev

# Prisma Studio起動（DB管理UI）
npx prisma studio

# データベースをリセット
npx prisma migrate reset

# Prisma Clientを再生成
npx prisma generate

# Vercelにデプロイ
vercel --prod

# ローカルでVercel環境をシミュレート
vercel dev
```

## 次のステップ

セットアップが完了したら：

1. `/auth/signin` にアクセスしてログイン
2. 管理者として初期ユーザーを承認
3. `/upload` ページでDICOMファイルをアップロード
4. `/browse` ページでデータを確認
5. CSVエクスポート機能を試す

問題が発生した場合は、GitHubのIssuesまたはREADME.mdを参照してください。



