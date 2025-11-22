import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        if (session && session.user) {
          setCurrentUser(session.user);
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        alert('ユーザー一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('このユーザーを承認しますか？')) return;

    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' }),
      });

      if (response.ok) {
        alert('ユーザーを承認しました');
        fetchUsers();
      } else {
        alert('承認に失敗しました');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('承認に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('このユーザーを拒否して削除しますか？この操作は取り消せません。')) return;

    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject' }),
      });

      if (response.ok) {
        alert('ユーザーを拒否しました');
        fetchUsers();
      } else {
        alert('拒否に失敗しました');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('拒否に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!confirm(`ロールを ${newRole} に変更しますか？`)) return;

    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'change_role', role: newRole }),
      });

      if (response.ok) {
        alert('ロールを変更しました');
        fetchUsers();
      } else {
        alert('ロール変更に失敗しました');
      }
    } catch (error) {
      console.error('Change role error:', error);
      alert('ロール変更に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('このユーザーを削除しますか？この操作は取り消せません。')) return;

    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('ユーザーを削除しました');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'user':
        return 'ユーザー';
      case 'pending':
        return '承認待ち';
      default:
        return role;
    }
  };

  return (
    <Layout requireAuth={true} requireAdmin={true}>
      <Head>
        <title>Admin Dashboard - DICOM Cloud</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-foreground-muted">
              Manage users, roles, and system settings.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Total Users</p>
            <p className="text-4xl font-bold text-white mt-2">{users.length}</p>
            <div className="mt-4 flex items-center text-sm text-success">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Active
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Pending Approval</p>
            <p className="text-4xl font-bold text-white mt-2">{users.filter((u) => u.role === 'pending').length}</p>
            <div className="mt-4 text-sm text-warning">
              Requires attention
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Active Users</p>
            <p className="text-4xl font-bold text-white mt-2">{users.filter((u) => u.role !== 'pending').length}</p>
            <div className="mt-4 text-sm text-foreground-muted">
              System operational
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-6 py-4 border-b border-white/5 bg-surface-highlight/30">
            <h2 className="text-lg font-semibold text-white">User Management</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="text-foreground-muted animate-pulse">Loading users...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <p className="text-foreground-muted">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-surface-highlight/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Uploads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-surface-highlight flex items-center justify-center text-white font-bold overflow-hidden border border-white/10">
                            {user.image ? (
                              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              <span>{user.name?.[0]}</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-foreground-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              user.role === 'user' ? 'bg-success/10 text-success border-success/20' :
                                'bg-warning/10 text-warning border-warning/20'
                            }`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {user._count.uploadBatches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {user.role === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-success hover:text-success-light disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-error hover:text-error-light disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.role === 'user' && (
                          <>
                            <button
                              onClick={() => handleChangeRole(user.id, 'admin')}
                              disabled={actionLoading === user.id}
                              className="text-primary hover:text-primary-light disabled:opacity-50 transition-colors"
                            >
                              Make Admin
                            </button>
                            {currentUser && currentUser.id !== user.id && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-error hover:text-error-light disabled:opacity-50 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {user.role === 'admin' && (
                          <>
                            {currentUser && currentUser.id !== user.id && (
                              <>
                                <button
                                  onClick={() => handleChangeRole(user.id, 'user')}
                                  disabled={actionLoading === user.id}
                                  className="text-foreground-muted hover:text-white disabled:opacity-50 transition-colors"
                                >
                                  Demote
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-error hover:text-error-light disabled:opacity-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {currentUser && currentUser.id === user.id && (
                              <span className="text-foreground-muted text-xs italic">
                                (You)
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}



