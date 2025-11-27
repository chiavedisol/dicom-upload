import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";

// 環境変数の検証（警告のみ、初期化は停止しない）
function validateEnvVars() {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
    console.warn('NextAuth may not work correctly without these variables');
  }
}

// 環境変数を検証（警告のみ）
validateEnvVars();

// Prismaアダプターの初期化を安全に行う
let adapter;
try {
  adapter = PrismaAdapter(prisma);
} catch (error) {
  console.error('Failed to initialize PrismaAdapter:', error);
  console.error('NextAuth will continue without adapter, but database sessions will not work');
  // アダプターの初期化に失敗した場合、undefinedのままにする
  // NextAuthはアダプターがundefinedの場合、JWTセッション戦略にフォールバックする
}

export const authOptions = {
  // アダプターが初期化に成功した場合のみ使用
  ...(adapter && { adapter: adapter }),
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
    async session({ session, user, token }) {
      try {
        // データベースセッション戦略の場合
        if (user && user.email) {
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
        }
        // JWTセッション戦略の場合（tokenから情報を取得）
        else if (token) {
          session.user.id = token.id;
          session.user.role = token.role;
        }

        return session;
      } catch (error) {
        console.error('Session error:', error);
        // エラーが発生してもセッションを返す（フォールバック）
        return session;
      }
    },
    async jwt({ token, user, account }) {
      // JWTセッション戦略の場合、トークンにユーザー情報を追加
      if (user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch (dbError) {
          console.error('JWT database error:', dbError);
          // エラーが発生しても続行
        }
      }
      return token;
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
    // アダプターが利用可能な場合のみデータベースセッションを使用
    // そうでない場合はJWTセッションにフォールバック
    strategy: adapter ? 'database' : 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

// NextAuthハンドラーをラップしてエラーハンドリングを改善
const handler = NextAuth(authOptions);

export default async function authHandler(req, res) {
  try {
    // NextAuthハンドラーを実行
    return await handler(req, res);
  } catch (error) {
    console.error('NextAuth handler error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      url: req.url,
      method: req.method
    });

    // JSONレスポンスを返す（HTMLではなく）
    // NextAuthのクライアントがJSONを期待しているため
    if (!res.headersSent) {
      res.status(500).json({
        error: 'InternalServerError',
        message: 'An error occurred while processing the authentication request',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack
        })
      });
    }
  }
}



