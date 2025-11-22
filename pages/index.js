import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/Layout';

// バイト数を人間が読みやすい形式に変換
function formatBytes(bytes) {
  if (bytes === 0n) return '0 B';
  
  const k = 1024n;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(Number(k)));
  
  return `${(Number(bytes) / Math.pow(Number(k), i)).toFixed(2)} ${sizes[i]}`;
}

export default function Home() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalInstances: 0,
    successfulInstances: 0,
    failedInstances: 0,
    monthlyInstances: 0,
    totalStorage: '0',
    successRate: 100,
    modalityStats: [],
    recentUploads: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout requireAuth={true}>
      <Head>
        <title>ダッシュボード - DICOM Batch Uploader</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h1>
          <p className="mt-2 text-gray-600">
            ようこそ、{session?.user?.name}さん
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  総アップロード数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalInstances}件
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  今月のアップロード
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.monthlyInstances}件
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  成功率
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.successRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  ストレージ使用量
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : formatBytes(BigInt(stats.totalStorage || '0'))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/upload"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  新規アップロード
                </h3>
                <p className="text-gray-600">
                  DICOMファイルをアップロードする
                </p>
              </div>
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/browse"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  データ閲覧
                </h3>
                <p className="text-gray-600">
                  アップロード済みのデータを閲覧・検索
                </p>
              </div>
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* 最近のアップロード履歴 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              最近のアップロード履歴
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-600">読み込み中...</p>
            ) : stats.recentUploads.length === 0 ? (
              <p className="text-gray-600">
                まだアップロード履歴がありません。
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        患者名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        患者ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        検査内容
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        モダリティ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        アップロード日時
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ユーザー
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentUploads.map((upload) => (
                      <tr key={upload.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {upload.patientName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {upload.patientId || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {upload.studyDescription || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {upload.modality || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(upload.uploadedAt).toLocaleString('ja-JP')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {upload.user?.name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
