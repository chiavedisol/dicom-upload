import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignIn() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <>
      <Head>
        <title>ログイン - DICOM Batch Uploader</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              DICOM Batch Uploader
            </h1>
            <p className="text-gray-600">
              Google アカウントでログインしてください
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-3">
                <p className="text-sm text-red-800">
                  {error === 'AccessDenied' && 'アクセスが拒否されました。アカウントが承認されていない可能性があります。'}
                  {error === 'Configuration' && '設定エラーが発生しました。Google OAuthの設定を確認してください。'}
                  {error === 'DatabaseConnection' && 'データベースへの接続に失敗しました。管理者にお問い合わせください。'}
                  {error === 'Verification' && '認証トークンの検証に失敗しました。再度お試しください。'}
                  {error === 'OAuthSignin' && 'Google認証の初期化に失敗しました。もう一度お試しください。問題が続く場合は、管理者にお問い合わせください。'}
                  {error === 'Callback' && 'Google認証のコールバック処理に失敗しました。データベースの設定を確認してください。'}
                  {error === 'OAuthCallback' && 'Google認証のコールバック処理に失敗しました。もう一度お試しください。'}
                  {error === 'OAuthCreateAccount' && 'アカウント作成中にエラーが発生しました。管理者にお問い合わせください。'}
                  {error === 'OAuthAccountNotLinked' && 'このGoogleアカウントは別のアカウントに既にリンクされています。'}
                  {error === 'EmailSignin' && 'メール認証に失敗しました。'}
                  {error === 'CredentialsSignin' && '認証情報が正しくありません。'}
                  {error === 'SessionRequired' && 'ログインが必要です。'}
                  {!['AccessDenied', 'Configuration', 'DatabaseConnection', 'Verification', 'OAuthSignin', 'Callback', 'OAuthCallback', 'OAuthCreateAccount', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 
                    `ログイン中にエラーが発生しました。エラーコード: ${error}`}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-red-600 mt-2 font-mono">
                    開発モード: {error}
                  </p>
                )}
              </div>
              {(error === 'OAuthSignin' || error === 'Callback' || error === 'OAuthCallback' || error === 'Configuration') && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700 font-semibold mb-2">
                    <strong>確認事項:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>データベースが正しく初期化されているか確認（<code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code>を実行）</li>
                    <li>Google Cloud ConsoleでOAuth設定とリダイレクトURIを確認</li>
                    <li>環境変数（GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、NEXTAUTH_URL）が正しく設定されているか確認</li>
                    <li>開発サーバーのコンソールログで詳細なエラーメッセージを確認</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              Google でログイン
            </span>
          </button>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              初回ログイン時は管理者の承認が必要です。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}



