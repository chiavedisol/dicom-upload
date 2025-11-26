import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const errorMessages = {
    Configuration: 'サーバー設定にエラーがあります。Google OAuthの設定を確認してください。管理者にお問い合わせください。',
    AccessDenied: 'アクセスが拒否されました。アカウントが承認されていない可能性があります。',
    DatabaseConnection: 'データベースへの接続に失敗しました。管理者にお問い合わせください。',
    Verification: '認証トークンの検証に失敗しました。再度お試しください。',
    OAuthSignin: 'Google認証の初期化に失敗しました。もう一度お試しください。問題が続く場合は、管理者にお問い合わせください。',
    Callback: 'Google認証のコールバック処理に失敗しました。データベースの初期化を確認してください。',
    OAuthCallback: 'Google認証のコールバック処理に失敗しました。もう一度お試しください。',
    OAuthCreateAccount: 'アカウント作成中にエラーが発生しました。管理者にお問い合わせください。',
    OAuthAccountNotLinked: 'このGoogleアカウントは別のアカウントに既にリンクされています。',
    EmailSignin: 'メール認証に失敗しました。',
    CredentialsSignin: '認証情報が正しくありません。',
    SessionRequired: 'ログインが必要です。',
    Default: '認証中にエラーが発生しました。',
  };

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <>
      <Head>
        <title>認証エラー - DICOM Batch Uploader</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              認証エラー
            </h1>

            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                <p className="text-xs text-gray-600 font-mono">
                  開発モード - エラーコード: {error}
                </p>
              </div>
            )}

            {error === 'AccessDenied' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  アカウントが承認されるまでお待ちください。
                  <br />
                  問題が解決しない場合は、管理者にお問い合わせください。
                </p>
              </div>
            )}

            {(error === 'OAuthSignin' || error === 'Callback' || error === 'OAuthCallback' || error === 'Configuration') && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  トラブルシューティング:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  {(error === 'Callback' || error === 'OAuthCallback') && (
                    <>
                      <li>データベースが正しく初期化されているか確認（<code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code>を実行）</li>
                      <li>データベースファイル（dev.db）が存在するか確認</li>
                      <li>DATABASE_URLが正しく設定されているか確認</li>
                    </>
                  )}
                  <li>Google Cloud ConsoleでOAuthクライアントIDが正しく設定されているか確認してください</li>
                  <li>リダイレクトURIが正しく設定されているか確認してください</li>
                  <li>環境変数（GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、NEXTAUTH_URL）が正しく設定されているか確認してください</li>
                  <li>開発サーバーのコンソールログで詳細なエラーメッセージを確認してください</li>
                </ul>
              </div>
            )}

            <Link
              href="/auth/signin"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-center"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}



