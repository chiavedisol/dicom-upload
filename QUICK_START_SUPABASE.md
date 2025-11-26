# Supabase移行 クイックスタートガイド

このガイドでは、5分でSupabaseへの移行を完了できます。

## 🚀 ステップ1: Supabaseプロジェクトを作成（2分）

1. [https://app.supabase.com/](https://app.supabase.com/) にアクセス
2. 右上の **New Project** をクリック
3. 以下を入力：
   - **Name**: `dicom-uploader`（任意の名前）
   - **Database Password**: 強力なパスワードを入力（**必ずメモしておく**）
   - **Region**: `Tokyo (ap-northeast-1)` を選択
4. **Create new project** をクリック
5. プロジェクトが作成されるまで1-2分待つ

## 🔗 ステップ2: 接続文字列を取得（1分）

1. Supabase Dashboardで作成したプロジェクトを開く
2. 左メニューから **Settings**（⚙️アイコン）をクリック
3. **Database** をクリック
4. 下にスクロールして **Connection string** セクションを見つける
5. **URI** タブを選択
6. **Connection string** のテキストボックスをクリックして全体をコピー

   形式: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

   > **注意**: Supabaseの接続文字列には`[YOUR-PASSWORD]`というプレースホルダーが含まれています。これは実際のパスワードに置き換える必要があります。

7. 接続文字列をコピーして、`[YOUR-PASSWORD]`部分を実際のパスワードに置き換える

   例:
   ```
   postgresql://postgres.abcdefghijklmnop:myPassword123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

## 📝 ステップ3: .envファイルを更新（1分）

### 方法A: スクリプトを使用（簡単）

ターミナルで以下を実行（接続文字列を実際の値に置き換える）：

```bash
node scripts/update-database-url.js "postgresql://postgres.xxxxx:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

### 方法B: 手動で編集

1. `.env`ファイルを開く
2. `DATABASE_URL`の行を探す
3. 以下のように変更：

```env
DATABASE_URL="postgresql://postgres.xxxxx:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

**重要**: 
- `xxxxx`をSupabaseのプロジェクト参照IDに置き換える
- `パスワード`を実際のデータベースパスワードに置き換える
- パスワードに特殊文字が含まれる場合は、URLエンコードが必要です

## ✅ ステップ4: 設定を確認（30秒）

```bash
node scripts/check-supabase-setup.js
```

すべての項目が✅になっていることを確認してください。

## ⚙️ ステップ5: Prisma Clientを再生成（30秒）

```bash
npx prisma generate
```

## 🗄️ ステップ6: マイグレーションを実行（1分）

```bash
npx prisma migrate deploy
```

正常に完了すると、以下のようなメッセージが表示されます：
```
✅ The migration has been applied
```

## 🎉 ステップ7: 接続テスト（30秒）

```bash
npx prisma studio
```

ブラウザが開き、Supabaseデータベースのテーブル一覧が表示されれば成功です！

## 🚀 ステップ8: アプリケーションを起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000/auth/signin` にアクセスして、ログインを試してください。

---

## ❓ トラブルシューティング

### 接続エラーが発生する場合

1. **パスワードの確認**
   - パスワードが正しいか確認
   - パスワードに特殊文字が含まれる場合は、URLエンコードが必要です：
     ```bash
     node scripts/encode-password.js "your-password"
     ```

2. **接続文字列の確認**
   - 接続文字列に余分なスペースや改行がないか確認
   - 引用符（`"`）が正しく閉じられているか確認

3. **Supabaseプロジェクトの状態確認**
   - Supabase Dashboardでプロジェクトがアクティブか確認
   - プロジェクトが一時停止されていないか確認

### マイグレーションエラーが発生する場合

```bash
# マイグレーション状態を確認
npx prisma migrate status

# 必要に応じてリセット（注意: データが削除されます）
npx prisma migrate reset
```

---

## 📚 詳細情報

- 詳細な手順: `SUPABASE_MIGRATION.md`
- チェックリスト: `MIGRATION_CHECKLIST.md`
- 接続情報メモ: `SUPABASE_CONNECTION_INFO.md`

