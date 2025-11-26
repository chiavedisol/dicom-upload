# 接続エラーの修正手順

現在、Supabaseへの接続ができていません。以下の手順で解決しましょう。

## 🔍 現在の状況

- 接続文字列は設定済み: `db.mjsfsgwnmejunqqhzlsq.supabase.co:5432`
- 接続エラー: `P1001: Can't reach database server`

## 🔧 解決方法

### 方法1: 接続プールを使用する（推奨）

Supabaseでは、通常は接続プールを使用します。以下の手順で接続プールの接続文字列を取得してください。

1. **Supabase Dashboardにアクセス**
   - [https://app.supabase.com/](https://app.supabase.com/)
   - プロジェクト `mjsfsgwnmejunqqhzlsq` を開く

2. **接続プールの接続文字列を取得**
   - 左メニュー → **Settings** → **Database**
   - 下にスクロールして **Connection pooling** セクションを見つける
   - **Session mode** の接続文字列をコピー

   形式:
   ```
   postgresql://postgres.mjsfsgwnmejunqqhzlsq:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

3. **接続文字列を更新**

   接続プールの接続文字列をコピーしたら、以下を実行:

   ```bash
   node scripts/update-database-url.js "接続プールの接続文字列"
   ```

   または、`.env`ファイルを直接編集:

   ```env
   DATABASE_URL="postgresql://postgres.mjsfsgwnmejunqqhzlsq:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
   ```

4. **接続テスト**

   ```bash
   node scripts/test-supabase-connection.js
   ```

### 方法2: プロジェクトの状態を確認

1. **Supabase Dashboardで確認**
   - プロジェクトのステータスが "Active" になっているか確認
   - プロジェクトが一時停止されていないか確認
   - プロジェクトが作成されてから2-3分経過しているか確認

2. **プロジェクトが一時停止されている場合**
   - Dashboardでプロジェクトを再開

### 方法3: パスワードを確認

1. **Supabase Dashboardで確認**
   - Settings → Database
   - データベースパスワードを確認
   - 必要に応じてパスワードをリセット

2. **パスワードに特殊文字が含まれる場合**
   - URLエンコードが必要です
   ```bash
   node scripts/encode-password.js "your-password"
   ```

### 方法4: 直接接続文字列を再取得

1. **Supabase Dashboard → Settings → Database**
2. **Connection string** セクション
3. **URI** タブを選択
4. 接続文字列をコピー（`[YOUR-PASSWORD]`を実際のパスワードに置き換える）

## 📝 接続文字列の形式の違い

### 直接接続（ポート5432）
```
postgresql://postgres:パスワード@db.プロジェクトID.supabase.co:5432/postgres
```

### 接続プール（ポート6543）- 推奨
```
postgresql://postgres.プロジェクトID:パスワード@aws-0-リージョン.pooler.supabase.com:6543/postgres
```

**注意**: 接続プールでは、ユーザー名が `postgres.プロジェクトID` の形式になります。

## 🚀 次のステップ

接続が成功したら：

```bash
# Prisma Clientを再生成
npx prisma generate

# マイグレーションを実行
npx prisma migrate deploy

# 接続テスト
npx prisma studio
```

## ❓ それでも解決しない場合

1. **Supabaseサポートに連絡**
   - Dashboard → Help & Support
   - エラーメッセージを共有

2. **プロジェクトを再作成**
   - 新しいSupabaseプロジェクトを作成
   - 接続文字列を再取得

3. **詳細なログを確認**
   ```bash
   node scripts/test-supabase-connection.js
   ```

