import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";

// 環境変数の検証
function validateEnvVars() {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`ConfigurationError: Missing ${missing.join(', ')}`);
  }
}

// 環境変数を検証（初期化時）
try {
  validateEnvVars();
} catch (error) {
  console.error('Environment validation failed:', error.message);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      try {
        // 環境変数の確認
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
          console.error('Missing Google OAuth credentials');
          throw new Error('ConfigurationError');
        }

        // ユーザーがDBに存在するか確認
        let existingUser;
        try {
          existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
        } catch (dbError) {
          console.error('Database query failed:', dbError);
          // データベースエラーの場合、接続を再試行
          if (dbError.code?.startsWith('P')) {
            throw new Error('DatabaseConnection');
          }
          throw dbError;
        }

        if (!existingUser) {
          // 新規ユーザーの場合、Adapterが自動的に作成するのでtrueを返す
          // デフォルトのroleは'pending'（schema.prismaで設定済み）
          return true;
        }

        // 承認待ちユーザーの場合
        if (existingUser.role === 'pending' && !existingUser.approvedAt) {
          return '/auth/pending';
        }

        // 承認済みユーザーの最終ログイン時刻を更新
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { lastLoginAt: new Date() },
          });
        } catch (updateError) {
          // 更新エラーは致命的ではないので、ログだけ記録して続行
          console.error('Failed to update lastLoginAt:', updateError);
        }

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          user: user?.email,
          code: error.code,
          meta: error.meta
        });

        // エラーの種類を判定してログに記録
        let errorType = 'AccessDenied';
        
        if (error.message === 'ConfigurationError' || error.message?.includes('ConfigurationError')) {
          errorType = 'Configuration';
          console.error('Configuration error: Missing Google OAuth credentials');
        } else if (error.message === 'DatabaseConnection' || 
                   error.code === 'P1001' || 
                   error.code === 'P1002' || 
                   error.code === 'P1003' ||
                   error.code === 'P1017') {
          errorType = 'DatabaseConnection';
          console.error('Database connection error detected');
        } else if (error.code?.startsWith('P')) {
          // その他のPrismaエラー
          errorType = 'DatabaseConnection';
          console.error('Database error:', error.code);
        }
        
        // エラータイプをURLパラメータとして渡すために、falseを返してNextAuthにエラーハンドリングを委譲
        // エラーページで詳細なメッセージを表示
        return false;
      }
    },
    async session({ session, user }) {
      try {
        // データベースから最新のユーザー情報を取得
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
          }
        } catch (dbError) {
          console.error('Session database error:', dbError);
          // データベースエラーが発生しても、既存のセッション情報を返す
          // これにより、データベース接続の問題でセッションが完全に失われることを防ぐ
        }

        return session;
      } catch (error) {
        console.error('Session error:', error);
        // エラーが発生してもセッションを返す（フォールバック）
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      // 承認待ちの場合は専用ページへ
      if (url.includes('/auth/pending')) {
        return `${baseUrl}/auth/pending`;
      }
      // デフォルトはホームページ
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);



