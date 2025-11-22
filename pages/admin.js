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
        <title>管理者ページ - DICOM Batch Uploader</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理者ページ</h1>
          <p className="mt-2 text-gray-600">ユーザー管理とシステム設定</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">承認待ち</p>
            <p className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => u.role === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">アクティブユーザー</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.role !== 'pending').length}
            </p>
          </div>
        </div>

        {/* ユーザー一覧テーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ユーザー一覧</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">ユーザーが見つかりません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ロール
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終ログイン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アップロード数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.image && (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-10 w-10 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString('ja-JP')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._count.uploadBatches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.role === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              拒否
                            </button>
                          </>
                        )}
                        {user.role === 'user' && (
                          <>
                            <button
                              onClick={() => handleChangeRole(user.id, 'admin')}
                              disabled={actionLoading === user.id}
                              className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            >
                              管理者化
                            </button>
                            {currentUser && currentUser.id !== user.id && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                削除
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
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                >
                                  ユーザー化
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  削除
                                </button>
                              </>
                            )}
                            {currentUser && currentUser.id === user.id && (
                              <span className="text-gray-400 text-xs">
                                (自分自身)
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



