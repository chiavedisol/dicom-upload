import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Navbar from './Navbar';

export default function Layout({ children, requireAuth = false, requireAdmin = false }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    // 認証が必要なページで未ログインの場合
    if (requireAuth && !session) {
      router.push('/auth/signin');
      return;
    }

    // 承認待ちユーザーの場合
    if (session && session.user.role === 'pending') {
      router.push('/auth/pending');
      return;
    }

    // 管理者権限が必要なページで管理者でない場合
    if (requireAdmin && session && session.user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, requireAuth, requireAdmin, router]);

  // 認証チェック中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証が必要だが未ログインの場合は何も表示しない（リダイレクト中）
  if (requireAuth && !session) {
    return null;
  }

  // 承認待ちの場合は何も表示しない（リダイレクト中）
  if (session && session.user.role === 'pending') {
    return null;
  }

  // 管理者権限が必要だが管理者でない場合は何も表示しない（リダイレクト中）
  if (requireAdmin && session && session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {session && session.user.role !== 'pending' && <Navbar />}
      <main>{children}</main>
    </div>
  );
}



