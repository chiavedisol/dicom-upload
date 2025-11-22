import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    gcpProjectId: '',
    gcpLocation: 'asia-northeast1',
    gcpDatasetId: '',
    gcpDicomStoreId: '',
    serviceAccountKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [dicomStores, setDicomStores] = useState([]);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig({
            ...data,
            serviceAccountKey: '', // セキュリティのため、キーは表示しない
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.gcpProjectId) {
      alert('プロジェクトIDは必須です');
      return;
    }

    if (!config.serviceAccountKey && showKeyInput) {
      alert('サービスアカウントキー（JSON）を入力してください');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert('設定を保存しました');
        setShowKeyInput(false);
        fetchConfig();
      } else {
        const error = await response.json();
        alert(`保存に失敗しました: ${error.message || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.gcpProjectId) {
      alert('まず設定を保存してください');
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        alert('接続テストに成功しました！');
      } else {
        alert(`接続テストに失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        error: error.message,
      });
      alert('接続テストに失敗しました');
    } finally {
      setTesting(false);
    }
  };

  const handleLoadDatasets = async () => {
    if (!config.gcpProjectId) {
      alert('まず設定を保存してください');
      return;
    }

    try {
      const response = await fetch(`/api/settings/datasets?location=${config.gcpLocation}`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      } else {
        alert('データセット一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Load datasets error:', error);
      alert('データセット一覧の取得に失敗しました');
    }
  };

  const handleLoadDicomStores = async () => {
    if (!config.gcpDatasetId) {
      alert('データセットを選択してください');
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/dicom-stores?location=${config.gcpLocation}&datasetId=${config.gcpDatasetId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDicomStores(data.dicomStores || []);
      } else {
        alert('DICOM Store一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Load DICOM stores error:', error);
      alert('DICOM Store一覧の取得に失敗しました');
    }
  };

  if (loading) {
    return (
      <Layout requireAuth={true} requireAdmin={true}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={true} requireAdmin={true}>
      <Head>
        <title>設定 - DICOM Batch Uploader</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Google Cloud設定</h1>
          <p className="mt-2 text-gray-600">
            Google Cloud Healthcare APIの接続設定を管理します
          </p>
        </div>

        {/* Google Cloud基本設定 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            基本設定
          </h2>

          <div className="space-y-4">
            {/* プロジェクトID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Cloud プロジェクトID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.gcpProjectId}
                onChange={(e) => setConfig({ ...config, gcpProjectId: e.target.value })}
                placeholder="your-project-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                例: dicom-first-project
              </p>
            </div>

            {/* リージョン */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リージョン <span className="text-red-500">*</span>
              </label>
              <select
                value={config.gcpLocation}
                onChange={(e) => setConfig({ ...config, gcpLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asia-northeast1">asia-northeast1 (東京)</option>
                <option value="us-central1">us-central1</option>
                <option value="us-east1">us-east1</option>
                <option value="us-west1">us-west1</option>
                <option value="europe-west2">europe-west2</option>
              </select>
            </div>

            {/* データセットID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                データセットID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.gcpDatasetId}
                  onChange={(e) => setConfig({ ...config, gcpDatasetId: e.target.value })}
                  placeholder="my-dataset"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLoadDatasets}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  一覧取得
                </button>
              </div>
              {datasets.length > 0 && (
                <select
                  onChange={(e) => setConfig({ ...config, gcpDatasetId: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {datasets.map((ds) => (
                    <option key={ds} value={ds}>
                      {ds}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* DICOM StoreID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DICOM Store ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.gcpDicomStoreId}
                  onChange={(e) => setConfig({ ...config, gcpDicomStoreId: e.target.value })}
                  placeholder="my-dicom-store"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLoadDicomStores}
                  disabled={!config.gcpDatasetId}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  一覧取得
                </button>
              </div>
              {dicomStores.length > 0 && (
                <select
                  onChange={(e) => setConfig({ ...config, gcpDicomStoreId: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {dicomStores.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* サービスアカウントキー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            サービスアカウント認証
          </h2>

          {!showKeyInput ? (
            <button
              onClick={() => setShowKeyInput(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              サービスアカウントキーを設定/更新
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                サービスアカウントキー（JSON） <span className="text-red-500">*</span>
              </label>
              <textarea
                value={config.serviceAccountKey}
                onChange={(e) => setConfig({ ...config, serviceAccountKey: e.target.value })}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Google Cloud ConsoleからダウンロードしたサービスアカウントキーのJSON内容を貼り付けてください
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || !config.gcpProjectId}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'テスト中...' : '接続テスト'}
          </button>
        </div>

        {/* テスト結果 */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-md ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold ${
              testResult.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {testResult.success ? '✓ 接続成功' : '✗ 接続失敗'}
            </h3>
            {testResult.error && (
              <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
            )}
            {testResult.projectId && (
              <p className="mt-2 text-sm text-green-700">
                プロジェクト: {testResult.projectId}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

