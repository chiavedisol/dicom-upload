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
        <title>Dashboard - DICOM Cloud</title>
      </Head>

      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-foreground-muted">
              Welcome back, <span className="text-foreground font-medium">{session?.user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">
              System Operational
            </span>
            <span className="text-xs text-foreground-muted">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Uploads"
            value={loading ? '...' : stats.totalInstances}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
            gradient="from-blue-500 to-cyan-500"
            trend="+12% this week"
          />
          <StatCard
            title="Monthly Activity"
            value={loading ? '...' : stats.monthlyInstances}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            gradient="from-violet-500 to-purple-500"
            trend="Active now"
          />
          <StatCard
            title="Success Rate"
            value={loading ? '...' : `${stats.successRate}%`}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-emerald-500 to-teal-500"
            trend="Optimal"
          />
          <StatCard
            title="Storage Used"
            value={loading ? '...' : formatBytes(BigInt(stats.totalStorage || '0'))}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
            gradient="from-orange-500 to-amber-500"
            trend="1.2 TB available"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/upload"
            className="group relative overflow-hidden rounded-2xl bg-surface border border-white/5 p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  New Upload
                </h3>
                <p className="text-foreground-muted max-w-xs">
                  Securely upload new DICOM files to the cloud storage with automatic processing.
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-highlight flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/browse"
            className="group relative overflow-hidden rounded-2xl bg-surface border border-white/5 p-8 transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all duration-500"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                  Browse Data
                </h3>
                <p className="text-foreground-muted max-w-xs">
                  Search, view, and manage existing patient records and imaging studies.
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-highlight flex items-center justify-center group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Uploads Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <Link href="/browse" className="text-sm text-primary hover:text-primary-glow transition-colors">
              View All &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-foreground-muted">Loading activity data...</div>
            ) : stats.recentUploads.length === 0 ? (
              <div className="p-8 text-center text-foreground-muted">
                No recent uploads found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Study</th>
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Modality</th>
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-foreground-muted uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recentUploads.map((upload) => (
                    <tr key={upload.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {upload.patientName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-muted font-mono">
                        {upload.patientId || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-muted">
                        {upload.studyDescription || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {upload.modality || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-muted">
                        {new Date(upload.uploadedAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-highlight flex items-center justify-center text-xs">
                            {upload.user?.name?.charAt(0) || '?'}
                          </div>
                          {upload.user?.name || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, gradient, trend }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-white/5 p-6 group hover:border-white/10 transition-all duration-300">
      <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground-muted">{title}</h3>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-lg shadow-black/20`}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <p className="mt-2 text-xs text-foreground-muted flex items-center gap-1">
          <span className="text-success">●</span> {trend}
        </p>
      </div>
    </div>
  );
}
