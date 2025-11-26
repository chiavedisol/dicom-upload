// Supabase接続設定チェックスクリプト
// 使用方法: node scripts/check-supabase-setup.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Supabase移行の準備状況を確認中...\n');

// .envファイルのチェック
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .envファイルが見つかりません');
  console.log('   プロジェクトルートに.envファイルを作成してください\n');
  process.exit(1);
}

console.log('✅ .envファイルが見つかりました\n');

// DATABASE_URLのチェック
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']([^"']+)["']/);

if (!dbUrlMatch) {
  console.log('❌ DATABASE_URLが見つかりません');
  console.log('   .envファイルにDATABASE_URLを設定してください\n');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];

if (dbUrl.startsWith('file:')) {
  console.log('⚠️  現在のDATABASE_URLはSQLiteです');
  console.log(`   現在: ${dbUrl.substring(0, 50)}...\n`);
  console.log('📝 次のステップ:');
  console.log('   1. Supabaseプロジェクトを作成');
  console.log('   2. 接続文字列を取得');
  console.log('   3. .envファイルのDATABASE_URLを更新\n');
} else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('✅ DATABASE_URLはPostgreSQL形式です');
  
  if (dbUrl.includes('supabase.co')) {
    console.log('✅ Supabaseの接続文字列が設定されています\n');
    
    // 接続文字列のバリデーション
    if (!dbUrl.includes('[YOUR-PASSWORD]') && !dbUrl.includes('xxxxx')) {
      console.log('📊 接続情報の確認:');
      const projectMatch = dbUrl.match(/db\.([^.]+)\.supabase\.co/);
      if (projectMatch) {
        console.log(`   プロジェクト参照ID: ${projectMatch[1]}`);
      }
      console.log('   パスワード: 設定済み\n');
      
      console.log('✅ 接続設定は完了しています');
      console.log('   次のステップ: npx prisma migrate deploy\n');
    } else {
      console.log('⚠️  接続文字列にプレースホルダーが残っています');
      console.log('   .envファイルのDATABASE_URLを実際の値に更新してください\n');
    }
  } else {
    console.log('ℹ️  一般的なPostgreSQL接続文字列です\n');
  }
} else {
  console.log('❌ DATABASE_URLの形式が正しくありません');
  console.log(`   現在: ${dbUrl.substring(0, 50)}...`);
  console.log('   形式: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres\n');
}

// その他の環境変数のチェック
const requiredVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

console.log('📋 環境変数のチェック:');
let allSet = true;
requiredVars.forEach(varName => {
  const regex = new RegExp(`${varName}=["']([^"']+)["']`);
  const match = envContent.match(regex);
  if (match && match[1] && !match[1].includes('your-') && !match[1].includes('YOUR-')) {
    console.log(`   ✅ ${varName}: 設定済み`);
  } else {
    console.log(`   ⚠️  ${varName}: 未設定またはプレースホルダーのまま`);
    allSet = false;
  }
});

if (!allSet) {
  console.log('\n⚠️  一部の環境変数が設定されていません');
  console.log('   すべての環境変数を設定してから移行を進めてください\n');
}

console.log('\n📚 詳細な手順は SUPABASE_MIGRATION.md を参照してください');

