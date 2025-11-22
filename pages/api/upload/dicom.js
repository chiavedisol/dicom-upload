import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { uploadToHealthcareApi } from '../../../lib/healthcare-api';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // 大きなDICOMファイルに対応
    },
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role === 'pending') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, metadata, dicomData } = req.body;

  if (!filename || !metadata || !dicomData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Base64デコードしてBufferに変換
    const dicomBuffer = Buffer.from(dicomData, 'base64');

    // 既存のインスタンスをチェック
    const existingInstance = await prisma.dicomInstance.findUnique({
      where: { sopInstanceUid: metadata.sopInstanceUid },
    });

    if (existingInstance) {
      return res.status(409).json({
        error: 'このDICOMファイルは既にアップロード済みです',
        details: {
          existingInstanceId: existingInstance.id,
          uploadedAt: existingInstance.uploadedAt,
          sopInstanceUid: metadata.sopInstanceUid,
        },
      });
    }

    // Healthcare APIにアップロード
    await uploadToHealthcareApi(dicomBuffer);

    // データ保持期限を計算（環境変数から取得、デフォルト90日）
    const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '90', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    // データベースに保存
    const dicomInstance = await prisma.dicomInstance.create({
      data: {
        userId: session.user.id,
        studyInstanceUid: metadata.studyInstanceUid,
        seriesInstanceUid: metadata.seriesInstanceUid,
        sopInstanceUid: metadata.sopInstanceUid,
        patientId: metadata.patientId,
        patientName: metadata.patientName,
        patientBirthDate: metadata.patientBirthDate,
        patientSex: metadata.patientSex,
        studyDate: metadata.studyDate,
        studyTime: metadata.studyTime,
        studyDescription: metadata.studyDescription,
        accessionNumber: metadata.accessionNumber,
        modality: metadata.modality,
        seriesNumber: metadata.seriesNumber,
        seriesDescription: metadata.seriesDescription,
        instanceNumber: metadata.instanceNumber,
        rows: metadata.rows,
        columns: metadata.columns,
        numberOfFrames: metadata.numberOfFrames,
        manufacturer: metadata.manufacturer,
        manufacturerModelName: metadata.manufacturerModelName,
        bodyPartExamined: metadata.bodyPartExamined,
        fullMetadata: JSON.stringify(metadata.fullMetadata || metadata), // オブジェクトを文字列化
        uploadStatus: 'uploaded',
        fileSize: BigInt(metadata.fileSize || dicomBuffer.length),
        originalFilename: metadata.originalFilename || filename,
        uploadedAt: new Date(),
        expiresAt,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Upload successful',
      instanceId: dicomInstance.id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // エラーをデータベースに記録
    try {
      await prisma.dicomInstance.create({
        data: {
          userId: session.user.id,
          studyInstanceUid: metadata.studyInstanceUid || '',
          seriesInstanceUid: metadata.seriesInstanceUid || '',
          sopInstanceUid: metadata.sopInstanceUid || `error-${Date.now()}`,
          fullMetadata: JSON.stringify(metadata), // オブジェクトを文字列化
          uploadStatus: 'failed',
          errorMessage: error.message,
          originalFilename: metadata.originalFilename || filename,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // エラーは7日後に削除
        },
      });
    } catch (dbError) {
      console.error('Failed to record error in database:', dbError);
    }

    res.status(500).json({
      error: error.message || 'Failed to upload DICOM file',
    });
  }
}



