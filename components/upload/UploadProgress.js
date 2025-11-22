export default function UploadProgress({ 
  total, 
  completed, 
  failed, 
  currentFile,
  isUploading,
  results = []
}) {
  const progress = total > 0 ? Math.round((completed + failed) / total * 100) : 0;
  const successRate = total > 0 ? Math.round(completed / total * 100) : 0;

  if (!isUploading && results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 進捗バー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isUploading ? 'アップロード中...' : 'アップロード完了'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {completed + failed} / {total}
            </span>
            <span className="text-2xl font-bold text-indigo-600">
              {progress}%
            </span>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-sm text-gray-600">成功</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{failed}</p>
            <p className="text-sm text-gray-600">失敗</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{total - completed - failed}</p>
            <p className="text-sm text-gray-600">残り</p>
          </div>
        </div>

        {/* 現在処理中のファイル */}
        {isUploading && currentFile && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-md">
            <p className="text-sm text-indigo-900">
              <span className="font-medium">処理中:</span> {currentFile}
            </p>
          </div>
        )}

        {/* 完了メッセージ */}
        {!isUploading && results.length > 0 && (
          <div className={`mt-4 p-4 rounded-md ${
            failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              {failed === 0 ? (
                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <p className={`text-sm font-medium ${failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                  {failed === 0 
                    ? `すべてのファイル（${completed}件）のアップロードが完了しました！`
                    : `${completed}件のアップロードが完了しました。${failed}件が失敗しました。`
                  }
                </p>
                {successRate === 100 && (
                  <p className="text-xs text-green-700 mt-1">
                    成功率: {successRate}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* アップロード結果の詳細 */}
      {!isUploading && results.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">アップロード結果</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ファイル名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メッセージ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr 
                    key={index} 
                    className={
                      result.status === 'failed' ? 'bg-red-50' : 
                      result.status === 'warning' ? 'bg-yellow-50' : ''
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {result.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'success' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          成功
                        </span>
                      ) : result.status === 'warning' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          警告
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          失敗
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {result.error || 'アップロード完了'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



