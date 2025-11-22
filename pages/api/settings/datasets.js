import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { GoogleAuth } from 'google-auth-library';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // 管理者のみアクセス可能
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'アクセス権限がありません' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { location } = req.query;

    // 設定を取得
    const config = await prisma.cloudConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!config || !config.serviceAccountKey) {
      return res.status(400).json({ error: 'サービスアカウントキーが設定されていません' });
    }

    // サービスアカウントキーをパース
    const credentials = JSON.parse(config.serviceAccountKey);

    // Google Authクライアントを作成
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-healthcare'],
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    // データセット一覧を取得
    const url = `https://healthcare.googleapis.com/v1/projects/${projectId}/locations/${location || config.gcpLocation}/datasets`;
    
    const response = await client.request({ url });
    
    // データセット名のリストを抽出
    const datasets = (response.data.datasets || []).map(ds => {
      const parts = ds.name.split('/');
      return parts[parts.length - 1]; // データセットID部分のみ
    });

    return res.status(200).json({ datasets });
  } catch (error) {
    console.error('Get datasets error:', error);
    return res.status(500).json({ error: `データセット取得エラー: ${error.message}` });
  }
}

