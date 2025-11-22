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
        <title>アップロード - DICOM Batch Uploader</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            DICOMファイルアップロード
          </h1>
          <p className="mt-2 text-gray-600">
            DICOMファイルを選択してメタデータを確認・編集した後、DICOM Storeにアップロードします
          </p>
        </div>

        {/* ファイル選択 */}
        <div className="mb-8">
          <FileDropzone 
            onFilesSelected={handleFilesSelected}
            disabled={isParsing || isUploading}
          />
          
          {isParsing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-indigo-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>DICOMファイルを解析中...</span>
              </div>
            </div>
          )}
        </div>

        {/* メタデータテーブル */}
        {parsedFiles.length > 0 && (
          <div className="mb-8">
            <MetadataTable
              parsedFiles={parsedFiles}
              onMetadataEdit={handleMetadataEdit}
              onRemoveFile={handleRemoveFile}
            />

            {/* アクションボタン */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleClearAll}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                すべてクリア
              </button>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  有効なファイル: <span className="font-medium text-gray-900">{validFilesCount}</span>件
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || validFilesCount === 0}
                  className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'アップロード中...' : `${validFilesCount}件をアップロード`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* アップロード進捗 */}
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



