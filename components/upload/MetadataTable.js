import { useState } from 'react';

export default function MetadataTable({ parsedFiles, onMetadataEdit, onRemoveFile }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const editableFields = [
    { key: 'patientName', label: '患者名' },
    { key: 'patientId', label: '患者ID' },
    { key: 'studyDescription', label: '検査説明' },
    { key: 'seriesDescription', label: 'シリーズ説明' },
    { key: 'bodyPartExamined', label: '検査部位' },
  ];

  const displayFields = [
    { key: 'originalFilename', label: 'ファイル名' },
    { key: 'patientName', label: '患者名', editable: true },
    { key: 'patientId', label: '患者ID', editable: true },
    { key: 'studyDate', label: '検査日', format: (val) => val ? new Date(val).toLocaleDateString('ja-JP') : '-' },
    { key: 'modality', label: 'モダリティ' },
    { key: 'studyDescription', label: '検査説明', editable: true },
    { key: 'seriesDescription', label: 'シリーズ説明', editable: true },
    { key: 'bodyPartExamined', label: '検査部位', editable: true },
    { key: 'studyInstanceUid', label: 'Study UID', className: 'text-xs' },
    { key: 'seriesInstanceUid', label: 'Series UID', className: 'text-xs' },
    { key: 'sopInstanceUid', label: 'Instance UID', className: 'text-xs' },
  ];

  const handleCellClick = (fileIndex, fieldKey, currentValue) => {
    const field = displayFields.find(f => f.key === fieldKey);
    if (!field?.editable) return;

    setEditingCell({ fileIndex, fieldKey });
    setEditValue(currentValue || '');
  };

  const handleEditSave = () => {
    if (editingCell) {
      onMetadataEdit(editingCell.fileIndex, editingCell.fieldKey, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  if (parsedFiles.length === 0) {
    return (
      <div className="text-center py-12 bg-surface/50 rounded-xl border border-dashed border-white/10">
        <p className="text-foreground-muted">
          No files selected
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-semibold text-white">
          Selected Files <span className="ml-2 text-sm font-normal text-foreground-muted">({parsedFiles.length})</span>
        </h3>
        <p className="text-xs text-foreground-muted">
          <span className="text-primary font-medium">Click cells</span> to edit metadata
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-surface-highlight/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider w-12">
                  #
                </th>
                {displayFields.map((field) => (
                  <th
                    key={field.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider ${field.editable ? 'text-primary/80' : ''
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      {field.label}
                      {field.editable && (
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {parsedFiles.map((fileData, fileIndex) => (
                <tr key={fileIndex} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-muted">
                    {fileIndex + 1}
                  </td>
                  {displayFields.map((field) => {
                    const value = fileData.metadata[field.key];
                    const displayValue = field.format ? field.format(value) : (value || '-');
                    const isEditing = editingCell?.fileIndex === fileIndex && editingCell?.fieldKey === field.key;

                    return (
                      <td
                        key={field.key}
                        className={`px-4 py-3 text-sm ${field.className || ''} ${field.editable && !isEditing ? 'cursor-pointer hover:text-primary transition-colors' : ''
                          }`}
                        onClick={() => !isEditing && handleCellClick(fileIndex, field.key, value)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 bg-background border border-primary rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                        ) : (
                          <span className={`${field.editable ? 'text-white' : 'text-foreground-muted'}`}>
                            {displayValue}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {fileData.status === 'success' ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full border border-success/20">
                        Ready
                      </span>
                    ) : fileData.status === 'error' ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded-full border border-error/20">
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/10 text-foreground-muted rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => onRemoveFile(fileIndex)}
                      className="text-foreground-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {parsedFiles.some(f => f.status === 'error') && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error">
                Some files failed to parse
              </h3>
              <div className="mt-2 text-sm text-error/80">
                <ul className="list-disc list-inside space-y-1">
                  {parsedFiles.filter(f => f.status === 'error').map((f, i) => (
                    <li key={i}>
                      {f.file.name}: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



