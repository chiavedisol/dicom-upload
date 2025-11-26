# Supabase接続情報メモ

## プロジェクト情報

**プロジェクト名**: _______________________

**プロジェクト参照ID**: _______________________

**データベースパスワード**: _______________________ ⚠️ 必ず安全に保存してください

**リージョン**: _______________________

## 接続文字列

### 取得方法

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** セクション
3. **URI** タブを選択
4. 接続文字列をコピー

### 接続文字列の形式

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**実際の接続文字列**:

```
_________________________________________________________________
```

### 接続プールを使用する場合（推奨）

Supabase Dashboard → **Settings** → **Database** → **Connection pooling**

**Session mode** の接続文字列:

```
_________________________________________________________________
```

## .envファイルへの設定

以下の形式で`.env`ファイルの`DATABASE_URL`を更新:

```env
# 接続プール使用（推奨）
DATABASE_URL="postgresql://postgres:パスワード@db.プロジェクトID.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# または、直接接続
DATABASE_URL="postgresql://postgres:パスワード@db.プロジェクトID.supabase.co:5432/postgres"
```

## 注意事項

- パスワードに特殊文字が含まれる場合は、URLエンコードが必要です
- 接続文字列は機密情報のため、Gitにコミットしないでください
- `.env`ファイルは`.gitignore`に追加されていることを確認してください

