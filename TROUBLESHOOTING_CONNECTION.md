# Supabase接続エラーのトラブルシューティング

接続エラー `P1001: Can't reach database server` が発生した場合の解決方法です。

## 🔍 ステップ1: 接続テストを実行

```bash
node scripts/test-supabase-connection.js
```

このスクリプトで、接続文字列の形式と実際の接続をテストできます。

## 🔧 よくある問題と解決策

### 問題1: プロジェクトが完全に初期化されていない

**症状**: プロジェクト作成直後に接続エラーが発生

**解決策**:
1. Supabase Dashboardでプロジェクトを確認
2. プロジェクトのステータスが "Active" になっているか確認
3. プロジェクト作成後、2-3分待ってから再試行

### 問題2: 接続文字列の形式が正しくない

**症状**: 接続文字列が設定されているが接続できない

**確認ポイント**:

1. **直接接続の場合**:
   ```
   postgresql://postgres:パスワード@db.プロジェクトID.supabase.co:5432/postgres
   ```

2. **接続プール使用の場合**:
   ```
   postgresql://postgres.プロジェクトID:パスワード@aws-0-リージョン.pooler.supabase.com:6543/postgres
   ```

3. **パスワードに特殊文字が含まれる場合**:
   - URLエンコードが必要です
   - `node scripts/encode-password.js "your-password"` でエンコード

### 問題3: パスワードが間違っている

**症状**: 認証エラー（`P1000`）

**解決策**:
1. Supabase Dashboard → Settings → Database でパスワードを確認
2. パスワードをリセット（必要に応じて）
3. `.env`ファイルの`DATABASE_URL`を更新

### 問題4: 接続プールの設定が必要

**症状**: 直接接続で失敗する

**解決策**: 接続プールを使用する

1. Supabase Dashboard → Settings → Database
2. **Connection pooling** セクションを開く
3. **Session mode** の接続文字列をコピー
4. `.env`ファイルの`DATABASE_URL`を更新

### 問題5: ファイアウォールやネットワークの問題

**症状**: 接続タイムアウト

**解決策**:
1. ネットワーク接続を確認
2. VPNを切断して再試行
3. 別のネットワーク（モバイルホットスポットなど）で試す

## 📝 接続文字列の修正方法

### 方法1: 直接接続文字列を使用

`.env`ファイル:

```env
DATABASE_URL="postgresql://postgres:パスワード@db.mjsfsgwnmejunqqhzlsq.supabase.co:5432/postgres"
```

### 方法2: 接続プールを使用（推奨）

`.env`ファイル:

```env
DATABASE_URL="postgresql://postgres.mjsfsgwnmejunqqhzlsq:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

**注意**: 接続プールを使用する場合、ユーザー名の形式が `postgres.プロジェクトID` になります。

## 🔍 接続文字列の確認方法

1. **現在の接続文字列を確認**:
   ```bash
   node scripts/check-supabase-setup.js
   ```

2. **Supabase Dashboardで確認**:
   - Settings → Database → Connection string
   - **URI** タブで接続文字列を確認
   - **Connection pooling** セクションでプール用の接続文字列を確認

## 💡 推奨される接続方法

開発環境では、**接続プール（Session mode）**を使用することを推奨します：

```env
DATABASE_URL="postgresql://postgres.mjsfsgwnmejunqqhzlsq:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

メリット:
- 接続数の制限が緩和される
- パフォーマンスが向上する
- スケーラブル

## 🚨 緊急時の対処法

1. **Supabaseプロジェクトを再作成**:
   - 既存プロジェクトを削除
   - 新しいプロジェクトを作成
   - 接続文字列を再取得

2. **Supabaseサポートに連絡**:
   - Supabase Dashboard → Help & Support
   - エラーメッセージとプロジェクト情報を共有

3. **一時的にSQLiteに戻す**:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
   （本番環境にデプロイする前にPostgreSQLに戻してください）

## 📚 参考リンク

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Issues](https://www.prisma.io/docs/guides/troubleshooting/connection-issues)
- [Supabase Documentation](https://supabase.com/docs)

