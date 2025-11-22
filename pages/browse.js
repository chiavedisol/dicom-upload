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
        <title>Browse Data - DICOM Cloud</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Data Browser</h1>
            <p className="mt-1 text-foreground-muted">
              Search and manage uploaded DICOM instances.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-surface hover:bg-surface-highlight border border-white/10 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 text-success group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel rounded-2xl p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  Search Query
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by Patient Name, ID, or Study UID..."
                    className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-white/10 rounded-xl text-white placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  Modality
                </label>
                <select
                  value={modality}
                  onChange={(e) => {
                    setModality(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-4 py-2.5 bg-background/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none"
                >
                  {modalityOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-background text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 text-sm font-medium text-foreground-muted hover:text-white transition-colors"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Data Table */}
        <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-highlight/30">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Results <span className="text-foreground-muted font-normal">({pagination.total})</span>
            </h2>
            <div className="text-xs text-foreground-muted">
              {pagination.totalPages > 0 && (
                <>Page {pagination.page} of {pagination.totalPages}</>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="text-foreground-muted animate-pulse">Loading data...</span>
              </div>
            </div>
          ) : instances.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">No results found</h3>
              <p className="text-foreground-muted mt-1 max-w-sm">
                Try adjusting your search filters or upload new DICOM files.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-surface-highlight/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Study Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Modality
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        UIDs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-transparent">
                    {instances.map((instance) => (
                      <tr key={instance.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                            {instance.patientName || 'Unknown'}
                          </div>
                          <div className="text-xs text-foreground-muted mt-0.5 font-mono">
                            {instance.patientId || 'No ID'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            {instance.studyDescription || 'No Description'}
                          </div>
                          <div className="text-xs text-foreground-muted mt-0.5">
                            {instance.studyDate
                              ? new Date(instance.studyDate).toLocaleDateString('ja-JP')
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {instance.modality || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-foreground-muted space-y-1 font-mono">
                            <div className="truncate max-w-[150px] opacity-70 hover:opacity-100 transition-opacity cursor-help" title={`Study: ${instance.studyInstanceUid}`}>
                              S: {instance.studyInstanceUid}
                            </div>
                            <div className="truncate max-w-[150px] opacity-70 hover:opacity-100 transition-opacity cursor-help" title={`Series: ${instance.seriesInstanceUid}`}>
                              Se: {instance.seriesInstanceUid}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-highlight flex items-center justify-center text-xs font-bold text-foreground-muted">
                              {instance.user?.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="text-sm text-white">
                                {instance.user?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-foreground-muted">
                                {instance.uploadedAt
                                  ? new Date(instance.uploadedAt).toLocaleDateString('ja-JP')
                                  : '-'
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                          {instance.expiresAt
                            ? new Date(instance.expiresAt).toLocaleDateString('ja-JP')
                            : <span className="text-white/20">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-surface-highlight/30">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-surface border border-white/10 rounded-lg hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-foreground-muted">
                    Page <span className="text-white font-medium">{pagination.page}</span> of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-surface border border-white/10 rounded-lg hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
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


