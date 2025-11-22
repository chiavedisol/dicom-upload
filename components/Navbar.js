import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return null;
  }

  if (!session || session.user.role === 'pending') {
    return null;
  }

  const isActive = (path) => router.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                DICOM Batch Uploader
              </span>
            </Link>

            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                ダッシュボード
              </Link>

              <Link
                href="/upload"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/upload')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                アップロード
              </Link>

              <Link
                href="/browse"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/browse')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                データ閲覧
              </Link>

              {session.user.role === 'admin' && (
                <>
                  <Link
                    href="/admin"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive('/admin')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    管理者
                  </Link>
                  
                  <Link
                    href="/settings"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive('/settings')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    設定
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.role === 'admin' ? '管理者' : 'ユーザー'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}



