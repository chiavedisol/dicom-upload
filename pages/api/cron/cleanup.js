import prisma from '../../../lib/prisma';
import { deleteFromHealthcareApi } from '../../../lib/healthcare-api';

export default async function handler(req, res) {
  // Vercel Cronからの呼び出しを検証
  // 本番環境では Authorization ヘッダーでシークレットをチェック
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  let deletedCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    // 期限切れのインスタンスを取得
    const expiredInstances = await prisma.dicomInstance.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      take: 100, // 一度に最大100件処理
    });

    console.log(`Found ${expiredInstances.length} expired instances`);

    // 各インスタンスを削除
    for (const instance of expiredInstances) {
      try {
        // Healthcare APIから削除（アップロード済みのもののみ）
        if (instance.uploadStatus === 'uploaded') {
          try {
            await deleteFromHealthcareApi(
              instance.studyInstanceUid,
              instance.seriesInstanceUid,
              instance.sopInstanceUid
            );
            console.log(`Deleted from Healthcare API: ${instance.sopInstanceUid}`);
          } catch (apiError) {
            console.error(`Failed to delete from Healthcare API: ${instance.sopInstanceUid}`, apiError);
            // Healthcare APIからの削除に失敗してもDBからは削除する
            errors.push({
              instanceId: instance.id,
              sopInstanceUid: instance.sopInstanceUid,
              error: 'Healthcare API deletion failed',
              message: apiError.message,
            });
          }
        }

        // データベースから削除
        await prisma.dicomInstance.delete({
          where: {
            id: instance.id,
          },
        });

        deletedCount++;
        console.log(`Deleted from DB: ${instance.id}`);
      } catch (error) {
        console.error(`Failed to delete instance ${instance.id}:`, error);
        failedCount++;
        errors.push({
          instanceId: instance.id,
          sopInstanceUid: instance.sopInstanceUid,
          error: 'Database deletion failed',
          message: error.message,
        });
      }
    }

    // 孤立したアップロードバッチを削除
    // （すべてのインスタンスが削除されたバッチ）
    const orphanedBatches = await prisma.uploadBatch.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: 'completed',
      },
      include: {
        _count: {
          select: {
            dicomInstances: true,
          },
        },
      },
    });

    const batchesDeleted = [];
    for (const batch of orphanedBatches) {
      if (batch._count.dicomInstances === 0) {
        await prisma.uploadBatch.delete({
          where: {
            id: batch.id,
          },
        });
        batchesDeleted.push(batch.id);
      }
    }

    // 結果を返す
    const response = {
      success: true,
      timestamp: now.toISOString(),
      summary: {
        expiredInstancesFound: expiredInstances.length,
        instancesDeleted: deletedCount,
        instancesFailed: failedCount,
        batchesDeleted: batchesDeleted.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Cleanup completed:', response.summary);

    res.status(200).json(response);
  } catch (error) {
    console.error('Cleanup job error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup job failed',
      message: error.message,
      timestamp: now.toISOString(),
    });
  }
}



