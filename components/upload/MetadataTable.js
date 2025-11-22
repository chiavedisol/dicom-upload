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
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          ファイルを選択してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          選択されたファイル: {parsedFiles.length}件
        </h3>
        <p className="text-sm text-gray-600">
          <span className="text-indigo-600 font-medium">編集可能なフィールド</span>をクリックして編集できます
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {displayFields.map((field) => (
                <th
                  key={field.key}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    field.editable ? 'bg-indigo-50' : ''
                  }`}
                >
                  {field.label}
                  {field.editable && (
                    <span className="ml-1 text-indigo-600">✏️</span>
                  )}
                </th>
              ))}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parsedFiles.map((fileData, fileIndex) => (
              <tr key={fileIndex} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {fileIndex + 1}
                </td>
                {displayFields.map((field) => {
                  const value = fileData.metadata[field.key];
                  const displayValue = field.format ? field.format(value) : (value || '-');
                  const isEditing = editingCell?.fileIndex === fileIndex && editingCell?.fieldKey === field.key;

                  return (
                    <td
                      key={field.key}
                      className={`px-3 py-4 text-sm ${field.className || ''} ${
                        field.editable && !isEditing ? 'cursor-pointer hover:bg-indigo-50' : ''
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
                          className="w-full px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <span className={`${field.editable ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {displayValue}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-4 whitespace-nowrap">
                  {fileData.status === 'success' ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      解析完了
                    </span>
                  ) : fileData.status === 'error' ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      エラー
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      待機中
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onRemoveFile(fileIndex)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {parsedFiles.some(f => f.status === 'error') && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                一部のファイルの解析に失敗しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
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



