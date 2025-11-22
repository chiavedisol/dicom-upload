import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileDropzone({ onFilesSelected, disabled = false }) {
  const onDrop = useCallback((acceptedFiles) => {
    // DICOMファイル（.dcm）のみフィルタリング
    const dicomFiles = acceptedFiles.filter(file => {
      return file.name.toLowerCase().endsWith('.dcm') || 
             file.type === 'application/dicom' ||
             file.type === '';  // 一部のブラウザでDICOMファイルのMIMEタイプが空の場合がある
    });

    if (dicomFiles.length === 0) {
      alert('DICOMファイル（.dcm）を選択してください。');
      return;
    }

    if (dicomFiles.length !== acceptedFiles.length) {
      alert(`${acceptedFiles.length - dicomFiles.length}個のファイルがDICOM形式ではないためスキップされました。`);
    }

    onFilesSelected(dicomFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    maxFiles: 50, // Phase 3では300まで対応予定
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-4">
        <svg
          className={`w-16 h-16 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-indigo-600">
              ここにドロップしてください
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              DICOMファイルをドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-500 mb-4">
              または、クリックしてファイルを選択
            </p>
            <p className="text-xs text-gray-400">
              最大50ファイルまで選択可能（.dcm形式のみ）
            </p>
          </div>
        )}

        {disabled && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              アップロード中は新しいファイルを選択できません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



