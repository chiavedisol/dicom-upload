# Supabase移行チェックリスト

このチェックリストを使用して、Supabaseへの移行を段階的に進めてください。

## ✅ 事前準備

- [ ] Supabaseアカウントを作成（[https://supabase.com](https://supabase.com)）
- [ ] PrismaスキーマがPostgreSQL用に更新されていることを確認
- [ ] 現在の`.env`ファイルが存在することを確認

## 📝 ステップ1: Supabaseプロジェクトの作成

- [ ] [Supabase Dashboard](https://app.supabase.com/)にアクセス
- [ ] **New Project**をクリック
- [ ] プロジェクト情報を入力:
  - [ ] **Name**: プロジェクト名（例: `dicom-uploader`）
  - [ ] **Database Password**: 強力なパスワードを設定（**必ず保存してください**）
  - [ ] **Region**: 最も近いリージョンを選択（推奨: `Tokyo (ap-northeast-1)`）
- [ ] **Create new project**をクリック
- [ ] プロジェクトが作成されるまで数分待つ（完了通知が表示されます）

## 🔗 ステップ2: 接続文字列の取得

- [ ] Supabase Dashboardで作成したプロジェクトを選択
- [ ] 左メニューから **Settings** → **Database** に移動
- [ ] **Connection string**セクションを確認
- [ ] **URI**タブを選択
- [ ] 接続文字列をコピー（形式: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`）
- [ ] **Password**も別途保存（接続文字列の`[YOUR-PASSWORD]`部分を実際のパスワードに置き換える必要があります）

## 🔧 ステップ3: 環境変数の設定

### .envファイルの更新

1. プロジェクトルートの`.env`ファイルを開く

2. `DATABASE_URL`を以下の形式に更新:

```env
# 開発環境用（接続プール使用 - 推奨）
DATABASE_URL="postgresql://postgres:あなたのパスワード@db.プロジェクトID.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# または、直接接続
DATABASE_URL="postgresql://postgres:あなたのパスワード@db.プロジェクトID.supabase.co:5432/postgres"
```

**重要**:
- `[YOUR-PASSWORD]`をSupabaseで設定した実際のパスワードに置き換える
- パスワードに特殊文字が含まれる場合は、URLエンコードが必要な場合があります
- `プロジェクトID`を実際のSupabaseプロジェクト参照IDに置き換える

3. パスワードのURLエンコードが必要な場合:

| 文字 | エンコード後 |
|------|-------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |

- [ ] `.env`ファイルの`DATABASE_URL`を更新
- [ ] パスワードが正しく設定されているか確認

## 🔍 ステップ4: 接続設定の確認

- [ ] チェックスクリプトを実行:
  ```bash
  node scripts/check-supabase-setup.js
  ```
- [ ] すべてのチェックが✅になっていることを確認

## ⚙️ ステップ5: Prisma Clientの再生成

- [ ] Prisma Clientを再生成:
  ```bash
  npx prisma generate
  ```
- [ ] エラーが発生しないことを確認

## 🗄️ ステップ6: データベースマイグレーション

### 新規セットアップの場合

- [ ] マイグレーションを実行:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] マイグレーションが正常に完了することを確認

### 既存データがある場合（SQLiteから移行）

- [ ] 既存のSQLiteデータをエクスポート（必要に応じて）
- [ ] Supabaseにマイグレーションを適用:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] データの移行（必要に応じて）

## ✅ ステップ7: 接続テスト

- [ ] Prisma Studioでデータベースに接続:
  ```bash
  npx prisma studio
  ```
- [ ] ブラウザでSupabaseデータベースのテーブルが表示されることを確認
- [ ] テーブル構造が正しいことを確認

## 🚀 ステップ8: アプリケーションの動作確認

- [ ] 開発サーバーを起動:
  ```bash
  npm run dev
  ```
- [ ] ブラウザで `http://localhost:3000/auth/signin` にアクセス
- [ ] Google OAuthでログインを試す
- [ ] ログインが成功することを確認
- [ ] Supabase Dashboardの **Table Editor** で `sessions` テーブルを確認
- [ ] セッションが作成されていることを確認

## 📊 ステップ9: Supabase設定の最適化

- [ ] 接続プールの設定を確認（Supabase Dashboard → Settings → Database）
- [ ] 必要に応じてRLS（Row Level Security）ポリシーを設定
- [ ] バックアップ設定を確認

## 🎉 移行完了

- [ ] すべての機能が正常に動作することを確認
- [ ] 本番環境の環境変数を設定（Vercelなど）
- [ ] 本番環境にデプロイ

## 🔄 トラブルシューティング

問題が発生した場合は、`SUPABASE_MIGRATION.md`のトラブルシューティングセクションを参照してください。

よくある問題:
- 接続エラー: `DATABASE_URL`が正しく設定されているか確認
- マイグレーションエラー: Prismaスキーマとマイグレーションファイルが一致しているか確認
- 認証エラー: 環境変数がすべて設定されているか確認

