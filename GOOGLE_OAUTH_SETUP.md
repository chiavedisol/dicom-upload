# Google OAuth 2.0 クライアントIDとシークレットの作成手順

## 📋 概要
このガイドでは、DICOM Batch Uploaderアプリケーションで使用するGoogle OAuth 2.0認証情報の作成方法を説明します。

## 🚀 ステップバイステップ手順

### ステップ1: Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン

### ステップ2: プロジェクトの作成（まだない場合）

1. 画面上部の「プロジェクト選択」ドロップダウンをクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `dicom-uploader`）
4. 「作成」をクリックして、数秒待つ
5. プロジェクトが作成されたら、そのプロジェクトを選択

### ステップ3: OAuth同意画面の設定

1. 左側のメニューから **「APIとサービス」** → **「OAuth同意画面」** を選択
2. **ユーザータイプ**を選択:
   - **個人開発の場合**: 「外部」を選択（任意のGoogleアカウントでログイン可能）
   - **企業の場合**: 「内部」を選択（G Suiteドメイン内のみ）
3. 必須項目を入力:
   - **アプリ名**: `DICOM Batch Uploader`
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
4. 「保存して次へ」をクリック
5. **スコープ**設定画面では、そのまま「保存して次へ」をクリック
6. **テストユーザー**画面（外部の場合）では、必要に応じてメールアドレスを追加（後で追加可能）
7. **概要**画面で「ダッシュボードに戻る」をクリック

### ステップ4: OAuth 2.0 クライアントIDの作成

1. 左側のメニューから **「APIとサービス」** → **「認証情報」** に移動
2. 画面上部の **「認証情報を作成」** → **「OAuth 2.0 クライアントID」** を選択
3. **アプリケーションの種類**で **「ウェブアプリケーション」** を選択
4. 以下の設定を入力:

   - **名前**: `DICOM Uploader - Local Development`（または任意の名前）
   
   - **承認済みの JavaScript 生成元**:
     - `http://localhost:3000` を追加
   
   - **承認済みのリダイレクト URI**: 「URIを追加」をクリックして以下を追加
     ```
     http://localhost:3000/api/auth/callback/google
     ```
     
     本番環境がある場合は、以下のようなURIも追加:
     ```
     https://your-domain.vercel.app/api/auth/callback/google
     ```

5. 「作成」をクリック

### ステップ5: クライアントIDとシークレットの取得

1. ダイアログボックスが表示され、以下が表示されます:
   - **クライアントID**（`xxxxx.apps.googleusercontent.com` で終わる文字列）
   - **クライアントシークレット**（ランダムな文字列）
   
   ⚠️ **重要**: このシークレットは後から表示できない場合があるため、必ずコピーして保存してください！

2. 「OK」をクリックしてダイアログを閉じる

3. 作成した認証情報は「認証情報」ページの「OAuth 2.0 クライアントID」セクションに表示されます

### ステップ6: `.env`ファイルに設定

プロジェクトルートの`.env`ファイルを開き、以下の値を設定してください:

```env
GOOGLE_CLIENT_ID="ここにクライアントIDを貼り付け"
GOOGLE_CLIENT_SECRET="ここにクライアントシークレットを貼り付け"
```

例:
```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
```

## ✅ 確認事項

設定が完了したら、以下を確認してください:

- [ ] クライアントIDが正しく設定されているか
- [ ] クライアントシークレットが正しく設定されているか
- [ ] リダイレクトURIが `http://localhost:3000/api/auth/callback/google` と一致しているか
- [ ] OAuth同意画面の設定が完了しているか

## 🔧 トラブルシューティング

### エラー: `redirect_uri_mismatch`

**原因**: リダイレクトURIが一致していない

**解決策**:
1. Google Cloud Consoleの「認証情報」ページで、作成したOAuth 2.0 クライアントIDをクリック
2. 「承認済みのリダイレクト URI」に以下が追加されているか確認:
   - `http://localhost:3000/api/auth/callback/google`
3. URLに余分なスペースや改行がないか確認
4. 変更後、数分待ってから再度試す

### エラー: `OAuthSignin`

**原因**: OAuth認証の初期化に失敗

**解決策**:
1. `.env`ファイルの`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しく設定されているか確認
2. 値の前後に余分なスペースや引用符がないか確認
3. OAuth同意画面の設定が完了しているか確認
4. 開発サーバーを再起動する

### テストユーザーの追加（外部アプリの場合）

OAuth同意画面で「外部」を選択した場合、テストユーザーとして追加されたメールアドレスのみログインできます。

1. 「APIとサービス」→「OAuth同意画面」に移動
2. 「テストユーザー」セクションで「+ ユーザーを追加」をクリック
3. テスト用のGoogleアカウントのメールアドレスを追加
4. 本番環境に公開する場合は、「公開」ボタンをクリック（審査が必要な場合があります）

## 📚 参考リンク

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 設定ガイド](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js ドキュメント](https://next-auth.js.org/providers/google)

## 🎯 次のステップ

1. `.env`ファイルに設定を完了したら、開発サーバーを起動:
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/auth/signin` にアクセス

3. 「Google でログイン」ボタンをクリックして、ログインが正常に動作するか確認

