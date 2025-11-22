import { PrismaClient } from '@prisma/client';

// PrismaClientのシングルトンインスタンス
// 開発環境でHot Reloadによる複数インスタンス作成を防ぐ

// DATABASE_URLは環境変数から自動的に読み込まれます
// .envファイルまたは実行時の環境変数で設定してください

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;



