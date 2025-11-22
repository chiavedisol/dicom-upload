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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 設定を取得
    const config = await prisma.cloudConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!config || !config.serviceAccountKey) {
      return res.status(400).json({
        success: false,
        error: 'サービスアカウントキーが設定されていません',
      });
    }

    // サービスアカウントキーをパース
    const credentials = JSON.parse(config.serviceAccountKey);

    // Google Authクライアントを作成
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-healthcare'],
    });

    // 認証テスト
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    // Healthcare APIエンドポイントにアクセステスト
    const url = `https://healthcare.googleapis.com/v1/projects/${projectId}/locations/${config.gcpLocation}/datasets`;
    
    try {
      const response = await client.request({ url });
      
      // 接続成功を記録
      await prisma.cloudConfig.update({
        where: { id: config.id },
        data: {
          connectionStatus: 'success',
          lastTestedAt: new Date(),
          connectionError: null,
        },
      });

      return res.status(200).json({
        success: true,
        projectId,
        datasetsCount: response.data.datasets?.length || 0,
      });
    } catch (apiError) {
      // Healthcare APIエラー
      await prisma.cloudConfig.update({
        where: { id: config.id },
        data: {
          connectionStatus: 'failed',
          lastTestedAt: new Date(),
          connectionError: apiError.message,
        },
      });

      return res.status(200).json({
        success: false,
        error: `Healthcare API接続エラー: ${apiError.message}`,
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    
    // エラーを記録
    try {
      const config = await prisma.cloudConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      
      if (config) {
        await prisma.cloudConfig.update({
          where: { id: config.id },
          data: {
            connectionStatus: 'failed',
            lastTestedAt: new Date(),
            connectionError: error.message,
          },
        });
      }
    } catch (dbError) {
      console.error('Failed to update connection status:', dbError);
    }

    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}

