import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Papa from 'papaparse';

export default function BrowsePage() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [modality, setModality] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchInstances();
  }, [pagination.page, search, modality]);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (modality) params.append('modality', modality);

      const response = await fetch(`/api/dicom/instances?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances);
        setPagination(data.pagination);
      } else {
        alert('データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setModality('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = () => {
    if (instances.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    // # データセット作成
    // gcloud healthcare datasets create my-dataset --location=asia-northeast1
    
    // # DICOM Store作成
    // gcloud healthcare dicom-stores create my-dicom-store \
    //   --dataset=my-dataset \
    //   --location=asia-northeast1

    // # プロジェクトを設定
    // gcloud config set project dicom-first-project

    // CSVデータを準備
    const csvData = instances.map(instance => ({
      'アップロード日時': instance.uploadedAt ? new Date(instance.uploadedAt).toLocaleString('ja-JP') : '',
      'アップロードユーザー': instance.user?.name || '',
      'Study UID': instance.studyInstanceUid,
      'Series UID': instance.seriesInstanceUid,
      'Instance UID': instance.sopInstanceUid,
      '患者名': instance.patientName || '',
      '患者ID': instance.patientId || '',
      '生年月日': instance.patientBirthDate ? new Date(instance.patientBirthDate).toLocaleDateString('ja-JP') : '',
      '性別': instance.patientSex || '',
      '検査日': instance.studyDate ? new Date(instance.studyDate).toLocaleDateString('ja-JP') : '',
      '検査時刻': instance.studyTime || '',
      '検査説明': instance.studyDescription || '',
      'モダリティ': instance.modality || '',
      'シリーズ説明': instance.seriesDescription || '',
      'インスタンス番号': instance.instanceNumber || '',
      'ファイル名': instance.originalFilename || '',
      'ステータス': instance.uploadStatus,
      '削除予定日': instance.expiresAt ? new Date(instance.expiresAt).toLocaleDateString('ja-JP') : '',
    }));

    // PapaparseでCSV生成（UTF-8 BOM付き）
    const csv = '\uFEFF' + Papa.unparse(csvData);
    
    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dicom_instances_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalityOptions = [
    { value: '', label: 'すべて' },
    { value: 'CT', label: 'CT' },
    { value: 'MR', label: 'MR' },
    { value: 'CR', label: 'CR' },
    { value: 'DX', label: 'DX' },
    { value: 'US', label: 'US' },
    { value: 'XA', label: 'XA' },
    { value: 'RF', label: 'RF' },
    { value: 'NM', label: 'NM' },
    { value: 'PT', label: 'PT' },
  ];

  return (
    <Layout requireAuth={true}>
      <Head>
        <title>データ閲覧 - DICOM Batch Uploader</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">データ閲覧</h1>
          <p className="mt-2 text-gray-600">
            アップロード済みのDICOMインスタンスを閲覧・検索できます
          </p>
        </div>

        {/* 検索とフィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検索（患者名、患者ID、Study UID）
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="検索キーワードを入力..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  モダリティ
                </label>
                <select
                  value={modality}
                  onChange={(e) => {
                    setModality(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {modalityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                検索
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                クリア
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV エクスポート
              </button>
            </div>
          </form>
        </div>

        {/* データテーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              検索結果: {pagination.total}件
            </h2>
            <div className="text-sm text-gray-600">
              {pagination.totalPages > 0 && (
                <>
                  ページ {pagination.page} / {pagination.totalPages}
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <span>読み込み中...</span>
              </div>
            </div>
          ) : instances.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">データが見つかりません</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        患者情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        検査情報
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        モダリティ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アップロード
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        削除予定日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instances.map((instance) => (
                      <tr key={instance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {instance.patientName || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {instance.patientId || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {instance.studyDescription || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instance.studyDate 
                              ? new Date(instance.studyDate).toLocaleDateString('ja-JP')
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                            {instance.modality || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="truncate max-w-xs" title={instance.studyInstanceUid}>
                              Study: {instance.studyInstanceUid}
                            </div>
                            <div className="truncate max-w-xs" title={instance.seriesInstanceUid}>
                              Series: {instance.seriesInstanceUid}
                            </div>
                            <div className="truncate max-w-xs" title={instance.sopInstanceUid}>
                              Instance: {instance.sopInstanceUid}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {instance.user?.name || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {instance.uploadedAt 
                              ? new Date(instance.uploadedAt).toLocaleDateString('ja-JP')
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {instance.expiresAt 
                            ? new Date(instance.expiresAt).toLocaleDateString('ja-JP')
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ページネーション */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <span className="text-sm text-gray-700">
                    ページ {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}


