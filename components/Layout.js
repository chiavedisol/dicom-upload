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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-surface-highlight rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-foreground-muted font-medium tracking-wide">INITIALIZING...</p>
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {session && session.user.role !== 'pending' && <Navbar />}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </main>
        
        <footer className="border-t border-white/5 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-foreground-muted">
            <p>&copy; {new Date().getFullYear()} DICOM Batch Uploader. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}



