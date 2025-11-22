import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role === 'pending') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 総アップロードバッチ数（全ユーザー）
    const totalBatches = await prisma.uploadBatch.count();

    // 総DICOMインスタンス数（全ユーザー）
    const totalInstances = await prisma.dicomInstance.count({
      where: {
        uploadStatus: 'uploaded',
      },
    });

    // 成功したDICOMインスタンス数
    const successfulInstances = await prisma.dicomInstance.count({
      where: {
        uploadStatus: 'uploaded',
      },
    });

    // 失敗したDICOMインスタンス数
    const failedInstances = await prisma.dicomInstance.count({
      where: {
        uploadStatus: 'failed',
      },
    });

    // 今月のアップロード数
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyInstances = await prisma.dicomInstance.count({
      where: {
        uploadStatus: 'uploaded',
        uploadedAt: {
          gte: startOfMonth,
        },
      },
    });

    // ストレージ使用量（バイト）
    const storageResult = await prisma.dicomInstance.aggregate({
      where: {
        uploadStatus: 'uploaded',
        fileSize: { not: null },
      },
      _sum: {
        fileSize: true,
      },
    });
    
    // BigIntの処理（nullチェック）
    let totalStorage = '0';
    if (storageResult._sum.fileSize !== null) {
      totalStorage = storageResult._sum.fileSize.toString();
    }

    // モダリティ別の統計
    const modalityStats = await prisma.dicomInstance.groupBy({
      by: ['modality'],
      where: {
        uploadStatus: 'uploaded',
      },
      _count: {
        modality: true,
      },
      orderBy: {
        _count: {
          modality: 'desc',
        },
      },
    });

    // 最近のアップロード（個別ファイル、最新10件）
    const recentUploads = await prisma.dicomInstance.findMany({
      take: 10,
      where: {
        uploadStatus: 'uploaded',
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      select: {
        id: true,
        patientName: true,
        patientId: true,
        studyDescription: true,
        modality: true,
        uploadedAt: true,
        originalFilename: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // アップロード成功率
    const totalUploads = successfulInstances + failedInstances;
    const successRate = totalUploads > 0 
      ? Math.round((successfulInstances / totalUploads) * 100) 
      : 100;

    res.status(200).json({
      totalBatches,
      totalInstances,
      successfulInstances,
      failedInstances,
      monthlyInstances,
      totalStorage, // 既に文字列に変換済み
      successRate,
      modalityStats,
      recentUploads,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}



