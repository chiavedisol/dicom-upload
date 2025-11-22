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

  const NavLink = ({ href, children }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${active ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
          }`}
      >
        {children}
        {active && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_var(--primary)] rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                DICOM Cloud
              </span>
            </Link>

            <div className="hidden sm:flex sm:space-x-2">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/upload">Upload</NavLink>
              <NavLink href="/browse">Browse</NavLink>

              {session.user.role === 'admin' && (
                <>
                  <div className="w-px h-6 bg-white/10 mx-2 self-center" />
                  <NavLink href="/admin">Admin</NavLink>
                  <NavLink href="/settings">Settings</NavLink>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                <p className="text-xs text-primary font-medium">
                  {session.user.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="h-9 w-9 rounded-full ring-2 ring-white/10"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-surface-highlight flex items-center justify-center ring-2 ring-white/10">
                  <span className="text-sm font-bold text-foreground-muted">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="p-2 text-foreground-muted hover:text-error transition-colors rounded-full hover:bg-white/5"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}



