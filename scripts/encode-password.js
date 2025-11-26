// パスワードURLエンコードヘルパー
// 使用方法: node scripts/encode-password.js "your-password"

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function urlEncodePassword(password) {
  // URLエンコード（特にPostgreSQL接続文字列で必要な文字）
  const specialChars = {
    '@': '%40',
    '#': '%23',
    '$': '%24',
    '%': '%25',
    '&': '%26',
    '+': '%2B',
    '=': '%3D',
    '?': '%3F',
    '/': '%2F',
    ':': '%3A',
    ';': '%3B',
    ' ': '%20'
  };
  
  let encoded = '';
  for (const char of password) {
    encoded += specialChars[char] || encodeURIComponent(char);
  }
  
  return encoded;
}

console.log('🔐 パスワードURLエンコードヘルパー\n');

if (process.argv[2]) {
  // コマンドライン引数からパスワードを取得
  const password = process.argv[2];
  const encoded = urlEncodePassword(password);
  
  console.log('元のパスワード:');
  console.log(`  ${password}\n`);
  console.log('エンコード後:');
  console.log(`  ${encoded}\n`);
  console.log('接続文字列での使用例:');
  console.log(`  postgresql://postgres:${encoded}@db.xxxxx.supabase.co:5432/postgres\n`);
  process.exit(0);
}

// 対話形式
rl.question('エンコードするパスワードを入力してください: ', (password) => {
  const encoded = urlEncodePassword(password);
  
  console.log('\n元のパスワード:');
  console.log(`  ${password}\n`);
  console.log('エンコード後:');
  console.log(`  ${encoded}\n`);
  console.log('接続文字列での使用例:');
  console.log(`  postgresql://postgres:${encoded}@db.xxxxx.supabase.co:5432/postgres\n`);
  
  rl.close();
});

