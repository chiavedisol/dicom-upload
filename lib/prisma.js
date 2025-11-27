import { PrismaClient } from '@prisma/client';

// PrismaClientのシングルトンインスタンス
// 開発環境でHot Reloadによる複数インスタンス作成を防ぐ

// DATABASE_URLは環境変数から自動的に読み込まれます
// .envファイルまたは実行時の環境変数で設定してください

// Vercelでの接続プール設定
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
};

// 接続プールの設定（Vercel用）
if (process.env.DATABASE_URL?.includes('pooler')) {
  prismaOptions.datasources = {
    db: {
      url: process.env.DATABASE_URL,
    },
  };
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
}

// グレースフルシャットダウン
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;



