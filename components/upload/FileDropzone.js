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
        relative overflow-hidden rounded-xl border-2 border-dashed p-16 text-center cursor-pointer
        transition-all duration-300 group
        ${isDragActive
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-[0_0_30px_rgba(59,130,246,0.2)]'
          : 'border-white/10 bg-surface hover:border-primary/50 hover:bg-surface-highlight'
        }
        ${isDragReject ? 'border-error bg-error/5' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:border-white/10 hover:bg-surface' : ''}
      `}
    >
      <input {...getInputProps()} />

      {/* Scanning effect line */}
      {!disabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className={`p-4 rounded-full bg-surface-highlight transition-transform duration-300 ${isDragActive ? 'scale-110 text-primary' : 'text-foreground-muted group-hover:text-primary group-hover:scale-110'}`}>
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {isDragActive ? (
          <div>
            <p className="text-xl font-bold text-primary">
              Drop files to analyze
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-bold text-white mb-2">
              Drag & Drop DICOM files
            </p>
            <p className="text-sm text-foreground-muted mb-6">
              or click to browse from your computer
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-foreground-muted">
              <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
              Max 50 files (.dcm)
            </div>
          </div>
        )}

        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
            <p className="text-sm font-medium text-foreground-muted bg-surface px-4 py-2 rounded-lg border border-white/10">
              Processing in progress...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}



