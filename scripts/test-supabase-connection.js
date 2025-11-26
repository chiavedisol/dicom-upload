// Supabase接続テストスクリプト
// 使用方法: node scripts/test-supabase-connection.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// .envファイルから環境変数を読み込む
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        const key = match[1].trim();
        let value = match[2].trim();
        // 引用符を削除
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function testConnection() {
  console.log('🔍 Supabase接続テストを開始します...\n');

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URLが設定されていません');
    console.log('   .envファイルにDATABASE_URLを設定してください\n');
    process.exit(1);
  }

  // 接続文字列の情報を表示（パスワードは隠す）
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('接続文字列:');
  console.log(`  ${maskedUrl}\n`);

  // 接続情報を解析
  try {
    const url = new URL(dbUrl);
    console.log('接続情報:');
    console.log(`  ホスト: ${url.hostname}`);
    console.log(`  ポート: ${url.port || '5432'}`);
    console.log(`  データベース: ${url.pathname.substring(1) || 'postgres'}\n`);
  } catch (e) {
    console.log('⚠️  接続文字列の解析に失敗しました\n');
  }

  console.log('接続を試行中...\n');

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // 接続テスト
    await prisma.$connect();
    console.log('✅ データベースへの接続に成功しました！\n');

    // テーブル一覧を取得
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('📊 データベース内のテーブル:');
    if (Array.isArray(tables) && tables.length > 0) {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   （テーブルがまだ作成されていません）');
      console.log('   次のステップ: npx prisma migrate deploy\n');
    }

    console.log('\n✅ 接続テストが正常に完了しました！\n');
    
  } catch (error) {
    console.log('❌ 接続エラーが発生しました:\n');
    console.log(`   エラーコード: ${error.code || 'N/A'}`);
    console.log(`   メッセージ: ${error.message}\n`);

    // エラーの種類に応じた解決策を提案
    if (error.code === 'P1001') {
      console.log('🔧 解決策:');
      console.log('   1. Supabaseプロジェクトが完全に初期化されているか確認');
      console.log('      - Supabase Dashboardでプロジェクトのステータスを確認');
      console.log('      - プロジェクトが一時停止されていないか確認\n');
      
      console.log('   2. 接続文字列を確認:');
      console.log('      - パスワードが正しいか確認');
      console.log('      - 接続文字列の形式が正しいか確認\n');
      
      console.log('   3. 接続プールを使用してみる:');
      console.log('      - Supabase Dashboard → Settings → Database');
      console.log('      - Connection pooling セクションから接続文字列を取得');
      console.log('      - Session mode の接続文字列を試す\n');
      
      console.log('   4. ファイアウォールの問題の可能性:');
      console.log('      - ネットワーク接続を確認');
      console.log('      - VPNを切断して再試行\n');
    } else if (error.code === 'P1000') {
      console.log('🔧 解決策:');
      console.log('   認証に失敗しています。パスワードを確認してください。\n');
    } else {
      console.log('🔧 詳細情報:');
      console.log(`   ${error.stack}\n`);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch(console.error);

