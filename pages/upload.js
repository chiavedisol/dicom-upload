import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import FileDropzone from '../components/upload/FileDropzone';
import MetadataTable from '../components/upload/MetadataTable';
import UploadProgress from '../components/upload/UploadProgress';
import { parseDicomFile } from '../lib/dicom-parser';

export default function UploadPage() {
  const [parsedFiles, setParsedFiles] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    currentFile: null,
  });
  const [uploadResults, setUploadResults] = useState([]);

  // ファイルが選択された時の処理
  const handleFilesSelected = async (files) => {
    setIsParsing(true);
    const newParsedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // DICOMファイルをArrayBufferとして読み込み
        const arrayBuffer = await file.arrayBuffer();

        // DICOMメタデータをパース
        const metadata = parseDicomFile(arrayBuffer);

        newParsedFiles.push({
          file,
          metadata: {
            ...metadata,
            originalFilename: file.name,
            fileSize: file.size,
          },
          arrayBuffer,
          status: 'success',
          error: null,
        });
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error);
        newParsedFiles.push({
          file,
          metadata: { originalFilename: file.name },
          arrayBuffer: null,
          status: 'error',
          error: error.message,
        });
      }
    }

    setParsedFiles([...parsedFiles, ...newParsedFiles]);
    setIsParsing(false);
  };

  // メタデータ編集
  const handleMetadataEdit = (fileIndex, fieldKey, newValue) => {
    setParsedFiles(prev => {
      const updated = [...prev];
      updated[fileIndex].metadata[fieldKey] = newValue;

      // fullMetadataも更新
      if (updated[fileIndex].metadata.fullMetadata) {
        const capitalizedKey = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
        updated[fileIndex].metadata.fullMetadata[capitalizedKey] = newValue;
      }

      return updated;
    });
  };

  // ファイル削除
  const handleRemoveFile = (fileIndex) => {
    setParsedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  // すべてクリア
  const handleClearAll = () => {
    if (confirm('すべてのファイルをクリアしますか？')) {
      setParsedFiles([]);
      setUploadResults([]);
      setUploadProgress({
        total: 0,
        completed: 0,
        failed: 0,
        currentFile: null,
      });
    }
  };

  // アップロード実行
  const handleUpload = async () => {
    if (parsedFiles.length === 0) {
      alert('アップロードするファイルがありません。');
      return;
    }

    // エラーがあるファイルを除外
    const validFiles = parsedFiles.filter(f => f.status === 'success');

    if (validFiles.length === 0) {
      alert('有効なファイルがありません。');
      return;
    }

    if (!confirm(`${validFiles.length}件のファイルをアップロードしますか？`)) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      total: validFiles.length,
      completed: 0,
      failed: 0,
      currentFile: null,
    });
    setUploadResults([]);

    const results = [];

    // アップロード処理
    for (let i = 0; i < validFiles.length; i++) {
      const fileData = validFiles[i];

      setUploadProgress(prev => ({
        ...prev,
        currentFile: fileData.file.name,
      }));

      try {
        // DICOMデータをBase64エンコード
        const base64Data = arrayBufferToBase64(fileData.arrayBuffer);

        // APIにアップロード
        const response = await fetch('/api/upload/dicom', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: fileData.file.name,
            metadata: fileData.metadata,
            dicomData: base64Data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // 409エラー（既にアップロード済み）の場合は警告として扱う
          if (response.status === 409) {
            results.push({
              filename: fileData.file.name,
              status: 'warning',
              error: errorData.error || 'このファイルは既にアップロード済みです',
            });

            setUploadProgress(prev => ({
              ...prev,
              completed: prev.completed + 1, // 完了としてカウント
            }));

            continue; // 次のファイルへ
          }

          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();

        results.push({
          filename: fileData.file.name,
          status: 'success',
          error: null,
        });

        setUploadProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      } catch (error) {
        console.error(`Upload failed for ${fileData.file.name}:`, error);

        results.push({
          filename: fileData.file.name,
          status: 'failed',
          error: error.message,
        });

        setUploadProgress(prev => ({
          ...prev,
          failed: prev.failed + 1,
        }));
      }
    }

    setUploadResults(results);
    setIsUploading(false);
    setUploadProgress(prev => ({
      ...prev,
      currentFile: null,
    }));
  };

  // ArrayBufferをBase64に変換
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const validFilesCount = parsedFiles.filter(f => f.status === 'success').length;

  return (
    <Layout requireAuth={true}>
      <Head>
        <title>Upload - DICOM Cloud</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Upload DICOM Files
            </h1>
            <p className="mt-1 text-foreground-muted">
              Securely transfer medical imaging data to the cloud.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="px-4 py-2 rounded-lg bg-surface border border-white/5 text-xs text-foreground-muted">
              Supported formats: <span className="text-primary">.dcm</span>
            </div>
          </div>
        </div>

        {/* File Selection Area */}
        <div className="glass-panel rounded-2xl p-1">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            disabled={isParsing || isUploading}
          />

          {isParsing && (
            <div className="p-8 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <span className="text-primary font-medium animate-pulse">Parsing DICOM metadata...</span>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Table */}
        {parsedFiles.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <MetadataTable
              parsedFiles={parsedFiles}
              onMetadataEdit={handleMetadataEdit}
              onRemoveFile={handleRemoveFile}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={handleClearAll}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>

              <div className="flex items-center gap-6">
                <div className="text-sm text-foreground-muted">
                  Valid files: <span className="font-bold text-white">{validFilesCount}</span>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || validFilesCount === 0}
                  className="relative group px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></div>
                  <span className="relative flex items-center gap-2">
                    {isUploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload {validFilesCount} Files
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        <UploadProgress
          total={uploadProgress.total}
          completed={uploadProgress.completed}
          failed={uploadProgress.failed}
          currentFile={uploadProgress.currentFile}
          isUploading={isUploading}
          results={uploadResults}
        />
      </div>
    </Layout>
  );
}



