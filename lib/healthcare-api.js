import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import prisma from './prisma';

// CloudConfigを取得
async function getCloudConfig() {
  const config = await prisma.cloudConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
  
  if (!config) {
    throw new Error('Cloud configuration not found. Please configure in Settings page.');
  }
  
  if (!config.gcpProjectId || !config.gcpDatasetId || !config.gcpDicomStoreId) {
    throw new Error('Incomplete cloud configuration. Please check Settings page.');
  }
  
  return config;
}

// Google Cloud Healthcare API クライアントを取得
async function getAuthClient() {
  const config = await getCloudConfig();
  
  if (!config.serviceAccountKey) {
    throw new Error('Service account key not configured. Please add it in Settings page.');
  }
  
  // サービスアカウントキーをJSONとしてパース
  const credentials = JSON.parse(config.serviceAccountKey);
  
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-healthcare'],
    credentials,
  });
  
  return { auth, config };
}

// DICOM Store のベースURL
const getDicomStoreUrl = (config) => {
  return `https://healthcare.googleapis.com/v1/projects/${config.gcpProjectId}/locations/${config.gcpLocation}/datasets/${config.gcpDatasetId}/dicomStores/${config.gcpDicomStoreId}`;
};

/**
 * DICOMインスタンスをDICOM Storeにアップロード（STOW-RS）
 * @param {Buffer} dicomBuffer - DICOMファイルのバイナリデータ
 * @returns {Promise<Object>} アップロード結果
 */
export async function uploadToHealthcareApi(dicomBuffer) {
  try {
    const { auth, config } = await getAuthClient();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `${getDicomStoreUrl(config)}/dicomWeb/studies`;

    const response = await axios.post(url, dicomBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/dicom',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Healthcare API upload error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 
      error.message || 
      'Failed to upload to DICOM Store'
    );
  }
}

/**
 * DICOMインスタンスをDICOM Storeから削除
 * @param {string} studyUid - Study Instance UID
 * @param {string} seriesUid - Series Instance UID
 * @param {string} instanceUid - SOP Instance UID
 * @returns {Promise<void>}
 */
export async function deleteFromHealthcareApi(studyUid, seriesUid, instanceUid) {
  try {
    const { auth, config } = await getAuthClient();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `${getDicomStoreUrl(config)}/dicomWeb/studies/${studyUid}/series/${seriesUid}/instances/${instanceUid}`;

    await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Healthcare API delete error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 
      error.message || 
      'Failed to delete from DICOM Store'
    );
  }
}

/**
 * DICOMインスタンスのメタデータを取得
 * @param {string} studyUid - Study Instance UID
 * @param {string} seriesUid - Series Instance UID
 * @param {string} instanceUid - SOP Instance UID
 * @returns {Promise<Object>} メタデータ
 */
export async function getMetadataFromHealthcareApi(studyUid, seriesUid, instanceUid) {
  try {
    const { auth, config } = await getAuthClient();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `${getDicomStoreUrl(config)}/dicomWeb/studies/${studyUid}/series/${seriesUid}/instances/${instanceUid}/metadata`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Accept': 'application/dicom+json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Healthcare API get metadata error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 
      error.message || 
      'Failed to get metadata from DICOM Store'
    );
  }
}

/**
 * すべてのStudyを検索
 * @returns {Promise<Array>} Study一覧
 */
export async function searchStudies() {
  try {
    const { auth, config } = await getAuthClient();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `${getDicomStoreUrl(config)}/dicomWeb/studies`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Accept': 'application/dicom+json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Healthcare API search studies error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 
      error.message || 
      'Failed to search studies from DICOM Store'
    );
  }
}



