import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const errorMessages = {
    Configuration: 'サーバー設定にエラーがあります。管理者にお問い合わせください。',
    AccessDenied: 'アクセスが拒否されました。アカウントが承認されていない可能性があります。',
    Verification: '認証トークンの検証に失敗しました。',
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

            {error === 'AccessDenied' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  アカウントが承認されるまでお待ちください。
                  <br />
                  問題が解決しない場合は、管理者にお問い合わせください。
                </p>
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



