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
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      modality = '',
      status = 'uploaded',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 検索条件を構築
    const where = {
      uploadStatus: status,
    };

    // 検索クエリ（患者名、患者ID、Study UID で検索）
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { patientId: { contains: search } },
        { studyInstanceUid: { contains: search } },
      ];
    }

    // モダリティフィルター
    if (modality) {
      where.modality = modality;
    }

    // データ取得
    const [instances, total] = await Promise.all([
      prisma.dicomInstance.findMany({
        where,
        skip,
        take,
        orderBy: {
          uploadedAt: 'desc',
        },
        select: {
          id: true,
          studyInstanceUid: true,
          seriesInstanceUid: true,
          sopInstanceUid: true,
          patientName: true,
          patientId: true,
          patientBirthDate: true,
          patientSex: true,
          studyDate: true,
          studyTime: true,
          studyDescription: true,
          modality: true,
          seriesDescription: true,
          instanceNumber: true,
          uploadStatus: true,
          originalFilename: true,
          uploadedAt: true,
          expiresAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.dicomInstance.count({ where }),
    ]);

    res.status(200).json({
      instances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get instances error:', error);
    res.status(500).json({ error: 'Failed to fetch DICOM instances' });
  }
}



