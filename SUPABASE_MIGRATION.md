# Supabase移行ガイド

このガイドでは、DICOM Batch UploaderをSupabase（PostgreSQL）に移行する手順を説明します。

## 📋 前提条件

- Supabaseアカウント（[https://supabase.com](https://supabase.com)）
- 既存のプロジェクト（SQLiteから移行する場合）
- 本番環境用の環境変数設定

## 🚀 移行手順

### ステップ1: Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. **New Project**をクリック
3. 以下の情報を入力：
   - **Name**: プロジェクト名（例: `dicom-uploader`）
   - **Database Password**: 強力なパスワードを設定（忘れずに保存してください）
   - **Region**: 最も近いリージョンを選択（例: `Tokyo (ap-northeast-1)`）
4. **Create new project**をクリック（プロジェクト作成には数分かかります）

### ステップ2: データベース接続情報の取得

1. Supabase Dashboardでプロジェクトを選択
2. 左メニューから **Settings** → **Database** に移動
3. **Connection string**セクションで **URI** を選択
4. 接続文字列をコピー（形式: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`）

### ステップ3: 環境変数の設定

#### ローカル開発環境用（`.env.local`）

`.env.local`ファイルを作成または更新：

```env
# ============================================
# Supabase Database (PostgreSQL)
# ============================================
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 本番環境用の接続文字列（直接接続）
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Google OAuth設定
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Cloud Healthcare API設定
GOOGLE_APPLICATION_CREDENTIALS="./.credentials.json"
GCP_PROJECT_ID="your-project-id"
GCP_LOCATION="asia-northeast1"
GCP_DATASET_ID="your-dataset-id"
GCP_DICOM_STORE_ID="your-dicom-store-id"

# Cron設定
CRON_SECRET="your-cron-secret-here"

# データ保持期間設定
DATA_RETENTION_DAYS="90"
NEXT_PUBLIC_DATA_RETENTION_DAYS="90"
```

**重要**:
- `[YOUR-PASSWORD]`をSupabaseで設定したデータベースパスワードに置き換えてください
- `xxxxx`をSupabaseプロジェクトのIDに置き換えてください
- 接続文字列のパスワードに特殊文字が含まれる場合は、URLエンコードが必要な場合があります

#### 本番環境用（Vercelなど）

Vercel Dashboardの **Settings** → **Environment Variables** で以下を設定：

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... その他の環境変数
```

### ステップ4: Prismaスキーマの更新

Prismaスキーマは既にPostgreSQL用に更新されています。確認：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### ステップ5: Prisma Clientの再生成

```bash
npx prisma generate
```

### ステップ6: データベースマイグレーションの実行

#### 新規セットアップの場合

```bash
# マイグレーションファイルを作成（初回のみ）
npx prisma migrate dev --name init_postgresql

# 本番環境に適用
npx prisma migrate deploy
```

#### 既存データがある場合（SQLiteから移行）

1. **既存データのエクスポート**（SQLiteから）

   ```bash
   # SQLiteデータベースを確認
   npx prisma studio --browser none
   ```

2. **Supabaseにマイグレーションを適用**

   ```bash
   # マイグレーションを適用
   npx prisma migrate deploy
   ```

3. **データの移行**（オプション）
   - SQLiteからデータをエクスポート
   - PostgreSQL形式に変換
   - Supabaseにインポート

   > **注意**: 大量のデータがある場合は、データ移行スクリプトを作成することを推奨します。

### ステップ7: 接続テスト

```bash
# Prisma Studioでデータベースに接続
npx prisma studio
```

ブラウザが開き、Supabaseデータベースの内容を確認できます。

### ステップ8: アプリケーションの動作確認

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ログイン機能をテスト：
   - `http://localhost:3000/auth/signin` にアクセス
   - Google OAuthでログインを試す

3. データベース接続を確認：
   - ログインが成功すれば、Supabaseにセッションが作成されているはずです
   - Supabase Dashboardの **Table Editor** で `sessions` テーブルを確認

## 🔧 Supabase設定の最適化

### 接続プールの設定

Supabaseは接続プールを提供しています。本番環境では、**Session mode** を使用することを推奨します。

**Supabase Dashboard** → **Settings** → **Database** → **Connection pooling** で：
- **Pooling mode**: `Session`
- **Connection string** をコピー（`?pgbouncer=true`が含まれている）

### 環境変数の使い分け

- **開発環境**: `pgbouncer=true`を使用（接続プール経由）
- **本番環境**: 直接接続または接続プールを使用（アプリケーションの要件に応じて）

### RLS（Row Level Security）の設定

セキュリティを強化するため、RLSポリシーを設定することを推奨します。

Supabase Dashboard → **Authentication** → **Policies** で、各テーブルに適切なポリシーを設定します。

## 📊 データベースの監視

### Supabase Dashboardで監視

1. **Database** → **Reports**: データベースのパフォーマンスを監視
2. **Logs**: SQLクエリとエラーログを確認
3. **Table Editor**: データを直接確認・編集

### クエリパフォーマンスの最適化

```sql
-- インデックスの確認
SELECT * FROM pg_indexes WHERE tablename = 'dicom_instances';

-- スロークエリの確認（Supabase DashboardのLogsから）
```

## 🚨 トラブルシューティング

### 接続エラー

**エラー**: `Can't reach database server`

**解決策**:
1. `DATABASE_URL`が正しく設定されているか確認
2. パスワードが正しいか確認（特殊文字はURLエンコードが必要な場合があります）
3. Supabaseプロジェクトがアクティブか確認

### マイグレーションエラー

**エラー**: `Migration failed`

**解決策**:
```bash
# マイグレーション状態を確認
npx prisma migrate status

# 必要に応じて、マイグレーションをリセット（注意: データが削除されます）
npx prisma migrate reset

# 再度マイグレーションを実行
npx prisma migrate dev
```

### 接続数制限エラー

**エラー**: `too many connections`

**解決策**:
1. 接続プール（pgbouncer）を使用する
2. `connection_limit`パラメータを設定
3. Prisma Clientの接続プール設定を調整

### タイムアウトエラー

**エラー**: `Connection timeout`

**解決策**:
1. 接続文字列に`connect_timeout`パラメータを追加
2. Supabaseのリージョンがアプリケーションサーバーに近いか確認

## 📝 本番環境デプロイ前のチェックリスト

- [ ] Supabaseプロジェクトが作成されている
- [ ] `DATABASE_URL`が正しく設定されている
- [ ] Prismaマイグレーションが完了している
- [ ] 環境変数がすべて設定されている
- [ ] Google OAuthのリダイレクトURIに本番URLが追加されている
- [ ] データベース接続が正常に動作している
- [ ] ログイン機能が正常に動作している
- [ ] データのバックアップが設定されている（Supabase自動バックアップ）

## 🔄 既存データの移行（SQLite → Supabase）

SQLiteから既存データを移行する場合：

1. **SQLiteデータをエクスポート**
   ```bash
   sqlite3 dev.db .dump > data.sql
   ```

2. **PostgreSQL形式に変換**
   - SQLiteのSQLとPostgreSQLのSQLは異なるため、手動で調整が必要
   - または、データ移行スクリプトを作成

3. **Supabaseにインポート**
   - Supabase Dashboardの **SQL Editor** を使用
   - または、`psql`コマンドを使用

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 💡 次のステップ

移行が完了したら：

1. パフォーマンステストを実行
2. バックアップ設定を確認
3. モニタリングを設定
4. セキュリティポリシーを設定（RLS）

