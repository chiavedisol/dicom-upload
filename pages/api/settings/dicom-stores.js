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
    const { location, datasetId } = req.query;

    if (!datasetId) {
      return res.status(400).json({ error: 'datasetIdは必須です' });
    }

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

    // DICOM Store一覧を取得
    const url = `https://healthcare.googleapis.com/v1/projects/${projectId}/locations/${location || config.gcpLocation}/datasets/${datasetId}/dicomStores`;
    
    const response = await client.request({ url });
    
    // DICOM Store名のリストを抽出
    const dicomStores = (response.data.dicomStores || []).map(store => {
      const parts = store.name.split('/');
      return parts[parts.length - 1]; // DICOM Store ID部分のみ
    });

    return res.status(200).json({ dicomStores });
  } catch (error) {
    console.error('Get DICOM stores error:', error);
    return res.status(500).json({ error: `DICOM Store取得エラー: ${error.message}` });
  }
}

