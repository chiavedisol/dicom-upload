# GitHubへのpush手順

## 現在の状況

- ✅ すべての変更はコミット済み（最新コミット: "supabase"）
- ⚠️ リモートリポジトリが設定されていません

## 手順

### ステップ1: GitHubリポジトリのURLを取得

GitHubでリポジトリを作成済みの場合、URLを確認してください。
未作成の場合は、[GitHub](https://github.com/new)で新しいリポジトリを作成してください。

### ステップ2: リモートリポジトリを追加

リポジトリのURLが `https://github.com/ユーザー名/リポジトリ名.git` の場合：

```bash
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
```

### ステップ3: リモートリポジトリにpush

```bash
git push -u origin master
```

または、ブランチ名が `main` の場合：

```bash
git push -u origin main
```

## 注意事項

- `.env`ファイルは`.gitignore`に含まれているため、コミットされません
- 機密情報（APIキー、パスワードなど）がコードに含まれていないか確認してください

