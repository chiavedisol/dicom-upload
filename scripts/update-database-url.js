// DATABASE_URL更新ヘルパースクリプト
// 使用方法: node scripts/update-database-url.js "postgresql://..."

const fs = require('fs');
const path = require('path');

console.log('📝 DATABASE_URL更新ヘルパー\n');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .envファイルが見つかりません');
  console.log('   プロジェクトルートに.envファイルを作成してください\n');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf-8');

// 既存のDATABASE_URLを確認
const dbUrlMatch = envContent.match(/DATABASE_URL=["']([^"']+)["']/);
if (dbUrlMatch) {
  console.log('現在のDATABASE_URL:');
  console.log(`  ${dbUrlMatch[1].substring(0, 80)}...\n`);
}

if (process.argv[2]) {
  // コマンドライン引数から新しいURLを取得
  const newUrl = process.argv[2];
  
  // DATABASE_URLを更新
  if (dbUrlMatch) {
    envContent = envContent.replace(
      /DATABASE_URL=["'][^"']+["']/,
      `DATABASE_URL="${newUrl}"`
    );
  } else {
    // DATABASE_URLが存在しない場合は追加
    envContent += `\nDATABASE_URL="${newUrl}"\n`;
  }
  
  // ファイルに書き込み
  fs.writeFileSync(envPath, envContent, 'utf-8');
  
  console.log('✅ DATABASE_URLを更新しました\n');
  console.log('新しいDATABASE_URL:');
  console.log(`  ${newUrl.substring(0, 80)}...\n`);
  console.log('次のステップ:');
  console.log('  npx prisma generate\n');
} else {
  console.log('使用方法:');
  console.log('  node scripts/update-database-url.js "postgresql://..."\n');
  console.log('例:');
  console.log('  node scripts/update-database-url.js "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"\n');
}

