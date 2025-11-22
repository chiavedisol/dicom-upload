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
        <title>Settings - DICOM Cloud</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
            <p className="mt-1 text-foreground-muted">
              Configure Google Cloud Healthcare API connection.
            </p>
          </div>
        </div>

        {/* Google Cloud Basic Settings */}
        <div className="glass-panel rounded-2xl p-8 animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Cloud Configuration
          </h2>

          <div className="space-y-6">
            {/* Project ID */}
            <div>
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Google Cloud Project ID <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={config.gcpProjectId}
                onChange={(e) => setConfig({ ...config, gcpProjectId: e.target.value })}
                placeholder="e.g., dicom-project-123"
                className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              <p className="mt-2 text-xs text-foreground-muted">
                The ID of your Google Cloud project containing the Healthcare API dataset.
              </p>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Region <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={config.gcpLocation}
                  onChange={(e) => setConfig({ ...config, gcpLocation: e.target.value })}
                  className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none"
                >
                  <option value="asia-northeast1" className="bg-background">asia-northeast1 (Tokyo)</option>
                  <option value="us-central1" className="bg-background">us-central1 (Iowa)</option>
                  <option value="us-east1" className="bg-background">us-east1 (South Carolina)</option>
                  <option value="us-west1" className="bg-background">us-west1 (Oregon)</option>
                  <option value="europe-west2" className="bg-background">europe-west2 (London)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="w-4 h-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dataset ID */}
            <div>
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Dataset ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={config.gcpDatasetId}
                  onChange={(e) => setConfig({ ...config, gcpDatasetId: e.target.value })}
                  placeholder="my-dataset"
                  className="flex-1 px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  onClick={handleLoadDatasets}
                  className="px-4 py-2 bg-surface hover:bg-surface-highlight border border-white/10 rounded-xl text-sm font-medium text-white transition-colors whitespace-nowrap"
                >
                  Load List
                </button>
              </div>
              {datasets.length > 0 && (
                <div className="mt-2 relative">
                  <select
                    onChange={(e) => setConfig({ ...config, gcpDatasetId: e.target.value })}
                    className="w-full px-4 py-2 bg-background/30 border border-white/5 rounded-lg text-sm text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                  >
                    <option value="" className="bg-background">Select from list...</option>
                    {datasets.map((ds) => (
                      <option key={ds} value={ds} className="bg-background">
                        {ds}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* DICOM Store ID */}
            <div>
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                DICOM Store ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={config.gcpDicomStoreId}
                  onChange={(e) => setConfig({ ...config, gcpDicomStoreId: e.target.value })}
                  placeholder="my-dicom-store"
                  className="flex-1 px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  onClick={handleLoadDicomStores}
                  disabled={!config.gcpDatasetId}
                  className="px-4 py-2 bg-surface hover:bg-surface-highlight border border-white/10 rounded-xl text-sm font-medium text-white transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load List
                </button>
              </div>
              {dicomStores.length > 0 && (
                <div className="mt-2 relative">
                  <select
                    onChange={(e) => setConfig({ ...config, gcpDicomStoreId: e.target.value })}
                    className="w-full px-4 py-2 bg-background/30 border border-white/5 rounded-lg text-sm text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                  >
                    <option value="" className="bg-background">Select from list...</option>
                    {dicomStores.map((store) => (
                      <option key={store} value={store} className="bg-background">
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Account Key */}
        <div className="glass-panel rounded-2xl p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Authentication
          </h2>

          {!showKeyInput ? (
            <button
              onClick={() => setShowKeyInput(true)}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-foreground-muted hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Set or Update Service Account Key</span>
            </button>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                Service Account Key (JSON) <span className="text-error">*</span>
              </label>
              <textarea
                value={config.serviceAccountKey}
                onChange={(e) => setConfig({ ...config, serviceAccountKey: e.target.value })}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={10}
                className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-white font-mono text-xs placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted">
                  Paste the content of the JSON key file downloaded from Google Cloud Console.
                </p>
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="text-sm text-foreground-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || !config.gcpProjectId}
            className="px-6 py-3 bg-surface hover:bg-surface-highlight border border-white/10 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Testing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Test Connection
              </>
            )}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${testResult.success
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-error/10 border-error/20 text-error'
            }`}>
            {testResult.success ? (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <h3 className="font-bold">
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </h3>
              {testResult.error && (
                <p className="mt-1 text-sm opacity-90">{testResult.error}</p>
              )}
              {testResult.projectId && (
                <p className="mt-1 text-sm opacity-90">
                  Connected to project: <span className="font-mono">{testResult.projectId}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

