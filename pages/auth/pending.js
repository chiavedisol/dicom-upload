import { signOut } from 'next-auth/react';
import Head from 'next/head';

export default function Pending() {
  return (
    <>
      <Head>
        <title>承認待ち - DICOM Batch Uploader</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              承認待ちです
            </h1>

            <p className="text-gray-600 mb-6">
              アカウントは作成されましたが、管理者の承認が必要です。
              <br />
              承認されるまでお待ちください。
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                承認されると、登録されたメールアドレスに通知が届きます。
                <br />
                （※通知機能は今後実装予定）
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



