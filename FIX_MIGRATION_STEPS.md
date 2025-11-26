# マイグレーション修正手順

## 🔍 問題

SQLite用のマイグレーションファイルがPostgreSQLでは動作しません。

## ✅ 実施済み

1. ✅ 既存のSQLiteマイグレーションをバックアップ: `prisma/migrations_sqlite_backup`
2. ✅ 新しいマイグレーションディレクトリを作成
3. ✅ `migration_lock.toml`を`postgresql`に更新

## 🚀 次のステップ

### 方法1: prisma db pushを使用（簡単・推奨）

```bash
# スキーマを直接データベースに適用（マイグレーションファイルは作成されない）
npx prisma db push

# その後、マイグレーションファイルを作成
npx prisma migrate dev --create-only --name init_postgresql
```

### 方法2: 手動でマイグレーションファイルを作成

スキーマからPostgreSQL用のマイグレーションファイルを手動で作成する必要があります。

## 📝 注意事項

- `prisma db push`は開発環境でのみ使用してください
- 本番環境では`prisma migrate deploy`を使用してください
- 既存のSQLiteマイグレーションは`prisma/migrations_sqlite_backup`にバックアップされています

