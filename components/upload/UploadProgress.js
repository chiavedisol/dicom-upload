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
    <div className="space-y-6 animate-fade-in">
      {/* Progress Card */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {isUploading ? 'Uploading Files...' : 'Upload Complete'}
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              {isUploading ? 'Please do not close this window.' : 'All operations finished.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white tracking-tight">
              {progress}%
            </div>
            <div className="text-xs text-foreground-muted font-medium">
              {completed + failed} / {total} processed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-surface-highlight rounded-full overflow-hidden mb-8">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_var(--primary)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface/50 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-success">{completed}</p>
            <p className="text-xs text-foreground-muted uppercase tracking-wider mt-1">Success</p>
          </div>
          <div className="bg-surface/50 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-error">{failed}</p>
            <p className="text-xs text-foreground-muted uppercase tracking-wider mt-1">Failed</p>
          </div>
          <div className="bg-surface/50 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-white">{total - completed - failed}</p>
            <p className="text-xs text-foreground-muted uppercase tracking-wider mt-1">Remaining</p>
          </div>
        </div>

        {/* Current File Indicator */}
        {isUploading && currentFile && (
          <div className="mt-6 flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-primary font-medium truncate">
              Processing: <span className="text-white">{currentFile}</span>
            </p>
          </div>
        )}

        {/* Completion Message */}
        {!isUploading && results.length > 0 && (
          <div className={`mt-6 p-4 rounded-xl border ${failed === 0 ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'
            }`}>
            <div className="flex items-center gap-3">
              {failed === 0 ? (
                <div className="p-2 rounded-full bg-success/20 text-success">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="p-2 rounded-full bg-warning/20 text-warning">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              <div>
                <p className={`text-sm font-bold ${failed === 0 ? 'text-success' : 'text-warning'}`}>
                  {failed === 0
                    ? 'Upload Completed Successfully'
                    : 'Upload Completed with Issues'
                  }
                </p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {failed === 0
                    ? `All ${completed} files have been uploaded to the cloud.`
                    : `${completed} files succeeded, ${failed} files failed.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Results Table */}
      {!isUploading && results.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">Upload Log</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-surface-highlight/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent">
                {results.map((result, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-white/[0.02] transition-colors ${result.status === 'failed' ? 'bg-error/5' :
                        result.status === 'warning' ? 'bg-warning/5' : ''
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {result.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'success' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full border border-success/20">
                          Success
                        </span>
                      ) : result.status === 'warning' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full border border-warning/20">
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded-full border border-error/20">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground-muted">
                      {result.error || 'OK'}
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



