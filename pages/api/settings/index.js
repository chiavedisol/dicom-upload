import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // 管理者のみアクセス可能
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'アクセス権限がありません' });
  }

  if (req.method === 'GET') {
    // 設定取得
    try {
      const config = await prisma.cloudConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!config) {
        return res.status(200).json(null);
      }

      // サービスアカウントキーはセキュリティのため返さない
      const { serviceAccountKey, ...safeConfig } = config;

      return res.status(200).json(safeConfig);
    } catch (error) {
      console.error('Get config error:', error);
      return res.status(500).json({ error: '設定の取得に失敗しました' });
    }
  } else if (req.method === 'POST') {
    // 設定保存
    try {
      const {
        gcpProjectId,
        gcpLocation,
        gcpDatasetId,
        gcpDicomStoreId,
        serviceAccountKey,
      } = req.body;

      if (!gcpProjectId) {
        return res.status(400).json({ error: 'プロジェクトIDは必須です' });
      }

      // サービスアカウントキーのバリデーション
      if (serviceAccountKey) {
        try {
          const keyObj = JSON.parse(serviceAccountKey);
          if (!keyObj.project_id || !keyObj.private_key) {
            return res.status(400).json({
              error: 'サービスアカウントキーの形式が正しくありません',
            });
          }
        } catch (e) {
          return res.status(400).json({
            error: 'サービスアカウントキーのJSONが正しくありません',
          });
        }
      }

      // 既存の設定を取得
      const existingConfig = await prisma.cloudConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const configData = {
        gcpProjectId,
        gcpLocation: gcpLocation || 'asia-northeast1',
        gcpDatasetId: gcpDatasetId || null,
        gcpDicomStoreId: gcpDicomStoreId || null,
        serviceAccountKey: serviceAccountKey || existingConfig?.serviceAccountKey || null,
        isConfigured: !!(gcpProjectId && (serviceAccountKey || existingConfig?.serviceAccountKey)),
        updatedBy: session.user.id,
      };

      let config;
      if (existingConfig) {
        // 更新
        config = await prisma.cloudConfig.update({
          where: { id: existingConfig.id },
          data: configData,
        });
      } else {
        // 新規作成
        config = await prisma.cloudConfig.create({
          data: configData,
        });
      }

      // サービスアカウントキーは返さない
      const { serviceAccountKey: _, ...safeConfig } = config;

      return res.status(200).json(safeConfig);
    } catch (error) {
      console.error('Save config error:', error);
      return res.status(500).json({ error: '設定の保存に失敗しました' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

