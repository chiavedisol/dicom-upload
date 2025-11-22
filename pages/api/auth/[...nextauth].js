import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";

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
        // ユーザーがDBに存在するか確認
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

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
        await prisma.user.update({
          where: { email: user.email },
          data: { lastLoginAt: new Date() },
        });

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          user: user?.email
        });
        return false;
      }
    },
    async session({ session, user }) {
      try {
        // データベースから最新のユーザー情報を取得
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
        }

        return session;
      } catch (error) {
        console.error('Session error:', error);
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



