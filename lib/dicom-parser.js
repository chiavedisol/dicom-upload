import * as dcmjs from 'dcmjs';
import * as dicomParser from 'dicom-parser';
import Encoding from 'encoding-japanese';

/**
 * DICOMファイルからメタデータを抽出
 * @param {ArrayBuffer} arrayBuffer - DICOMファイルのArrayBuffer
 * @returns {Object} 抽出されたメタデータ
 */
export function parseDicomFile(arrayBuffer) {
  try {
    // まずdcmjsでパースを試みる
    const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    // 主要なメタデータを抽出
    const metadata = {
      // UIDs
      studyInstanceUid: dataset.StudyInstanceUID || '',
      seriesInstanceUid: dataset.SeriesInstanceUID || '',
      sopInstanceUid: dataset.SOPInstanceUID || '',

      // Patient Information
      patientId: dataset.PatientID || null,
      patientName: dataset.PatientName || null,
      patientBirthDate: dataset.PatientBirthDate ? parseDate(dataset.PatientBirthDate) : null,
      patientSex: dataset.PatientSex || null,

      // Study Information
      studyDate: dataset.StudyDate ? parseDate(dataset.StudyDate) : null,
      studyTime: dataset.StudyTime || null,
      studyDescription: dataset.StudyDescription || null,
      accessionNumber: dataset.AccessionNumber || null,

      // Series Information
      modality: dataset.Modality || null,
      seriesNumber: dataset.SeriesNumber || null,
      seriesDescription: dataset.SeriesDescription || null,

      // Instance Information
      instanceNumber: dataset.InstanceNumber || null,
      rows: dataset.Rows || null,
      columns: dataset.Columns || null,
      numberOfFrames: dataset.NumberOfFrames || null,

      // Device Information
      manufacturer: dataset.Manufacturer || null,
      manufacturerModelName: dataset.ManufacturerModelName || null,
      bodyPartExamined: dataset.BodyPartExamined || null,

      // その他の有用な情報
      imageType: dataset.ImageType || null,
      contentDate: dataset.ContentDate ? parseDate(dataset.ContentDate) : null,
      contentTime: dataset.ContentTime || null,
      acquisitionDate: dataset.AcquisitionDate ? parseDate(dataset.AcquisitionDate) : null,
      acquisitionTime: dataset.AcquisitionTime || null,

      // 全メタデータ（JSON形式）
      fullMetadata: dataset,
    };

    return metadata;
  } catch (error) {
    // dcmjsで失敗した場合（文字セットエラーなど）、dicom-parserで再試行
    console.warn('dcmjs parse failed, trying with dicom-parser:', error.message);
    
    try {
      return parseDicomFileWithDicomParser(arrayBuffer);
    } catch (fallbackError) {
      console.error('DICOM parse error (both libraries failed):', fallbackError);
      throw new Error(`Failed to parse DICOM file: ${error.message}`);
    }
  }
}

/**
 * ISO 2022エンコードされた文字列をデコード
 * @param {Uint8Array} bytes - バイト配列
 * @returns {string} デコードされた文字列
 */
function decodeISO2022String(bytes) {
  if (!bytes || bytes.length === 0) return null;
  
  try {
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
      // エスケープシーケンス(ESC = 0x1B)をチェック
      if (bytes[i] === 0x1B && i + 2 < bytes.length) {
        const byte1 = bytes[i + 1];
        const byte2 = bytes[i + 2];
        const escapeSeq = String.fromCharCode(byte1, byte2);
        
        // ISO 2022 IR 87 (JIS X 0208 - 漢字・ひらがな)
        if (escapeSeq === '$B') {
          i += 3; // ESC $ B をスキップ
          const jisBytes = [0x1B, 0x24, 0x42]; // エスケープシーケンスを含める
          
          // 次のエスケープシーケンスまでのバイトを収集
          while (i < bytes.length && bytes[i] !== 0x1B) {
            jisBytes.push(bytes[i]);
            i++;
          }
          
          // ASCIIに戻すエスケープシーケンスを追加
          jisBytes.push(0x1B, 0x28, 0x42);
          
          // encoding-japaneseで変換
          try {
            const decoded = Encoding.convert(jisBytes, {
              to: 'UNICODE',
              from: 'JIS',
              type: 'string'
            });
            result += decoded;
          } catch (e) {
            console.warn('JIS decode failed:', e);
          }
          continue;
        }
        
        // ISO 2022 IR 13 (JIS X 0201 カタカナ) の宣言
        if (escapeSeq === ')I') {
          i += 3; // ESC ) I をスキップ
          
          // 重複したESC ) I をスキップ
          while (i + 2 < bytes.length && bytes[i] === 0x1B && 
                 bytes[i + 1] === 0x29 && bytes[i + 2] === 0x49) {
            i += 3;
          }
          
          // SO (Shift Out = 0x0E) がある場合
          if (i < bytes.length && bytes[i] === 0x0E) {
            i++; // SO をスキップ
            
            // SI (Shift In = 0x0F) またはESCまでカタカナを読む
            while (i < bytes.length && bytes[i] !== 0x0F && bytes[i] !== 0x1B) {
              const byte = bytes[i];
              // G1セット（0x21-0x5F）をUnicode半角カタカナに変換
              if (byte >= 0x21 && byte <= 0x5F) {
                result += String.fromCharCode(0xFF61 + (byte - 0x21));
              }
              i++;
            }
            
            // SI (Shift In) をスキップ
            if (i < bytes.length && bytes[i] === 0x0F) {
              i++;
            }
          } else {
            // SOなしのパターン - 直接0xA1-0xDFの範囲にカタカナがある
            while (i < bytes.length && bytes[i] !== 0x1B) {
              const byte = bytes[i];
              // JIS X 0201 カタカナ(0xA1-0xDF)をUnicode半角カタカナに変換
              if (byte >= 0xA1 && byte <= 0xDF) {
                result += String.fromCharCode(0xFF61 + (byte - 0xA1));
              } else if (byte >= 0x21 && byte <= 0x5F) {
                // G1セット（0x21-0x5F）も対応
                result += String.fromCharCode(0xFF61 + (byte - 0x21));
              }
              i++;
            }
          }
          continue;
        }
        
        // ASCII または JIS X 0201 ローマ字に戻る
        if (escapeSeq === '(B' || escapeSeq === '(J') {
          i += 3;
          // 次のエスケープシーケンスまでASCIIとして読む
          while (i < bytes.length && bytes[i] !== 0x1B) {
            if (bytes[i] >= 0x20 && bytes[i] < 0x7F) {
              result += String.fromCharCode(bytes[i]);
            }
            i++;
          }
          continue;
        }
        
        // 未知のエスケープシーケンス - スキップ
        i += 3;
        continue;
      }
      
      // SO (Shift Out) - G1セットに切り替え（カタカナ）
      if (bytes[i] === 0x0E) {
        i++;
        continue;
      }
      
      // SI (Shift In) - G0セットに戻る（ASCII）
      if (bytes[i] === 0x0F) {
        i++;
        continue;
      }
      
      // 通常のASCII文字
      if (bytes[i] >= 0x20 && bytes[i] < 0x7F) {
        result += String.fromCharCode(bytes[i]);
      }
      i++;
    }
    
    return result || null;
  } catch (error) {
    console.error('ISO 2022 decode error:', error);
    
    // フォールバック: encoding-japaneseで全体を試す
    try {
      const decoded = Encoding.convert(Array.from(bytes), {
        to: 'UNICODE',
        from: 'JIS',
        type: 'string'
      });
      if (decoded && decoded.trim()) return decoded.trim();
    } catch {}
    
    // 次のフォールバック: UTF-8
    try {
      const decoded = new TextDecoder('utf-8').decode(bytes);
      if (decoded && decoded.trim()) return decoded.trim();
    } catch {}
    
    // 最終フォールバック: iso-8859-1
    try {
      return new TextDecoder('iso-8859-1').decode(bytes).trim();
    } catch {
      return null;
    }
  }
}

/**
 * dicom-parserライブラリを使用してDICOMファイルをパース
 * @param {ArrayBuffer} arrayBuffer - DICOMファイルのArrayBuffer
 * @returns {Object} 抽出されたメタデータ
 */
function parseDicomFileWithDicomParser(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);

  // SpecificCharacterSet を確認
  const specificCharacterSet = dataSet.string('x00080005');
  const hasISO2022 = specificCharacterSet && (
    specificCharacterSet.includes('ISO 2022') || 
    specificCharacterSet.includes('ISO_IR')
  );

  // ヘルパー関数：タグから文字列を取得（ISO 2022対応）
  const getString = (tag) => {
    try {
      if (hasISO2022) {
        // ISO 2022エンコーディングの場合、生のバイト列を取得してデコード
        const element = dataSet.elements[tag];
        if (element) {
          const bytes = byteArray.slice(element.dataOffset, element.dataOffset + element.length);
          
          // デバッグ: 患者名の場合、バイトデータをログ出力
          if (tag === 'x00100010') {
            console.log('Patient Name raw bytes:', Array.from(bytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
            console.log('Patient Name as string:', Array.from(bytes).map(b => String.fromCharCode(b)).join(''));
          }
          
          const decoded = decodeISO2022String(bytes);
          
          // デバッグ: デコード結果
          if (tag === 'x00100010') {
            console.log('Patient Name decoded:', decoded);
          }
          
          return decoded;
        }
        return null;
      } else {
        return dataSet.string(tag) || null;
      }
    } catch (e) {
      console.error(`Error getting string for tag ${tag}:`, e);
      return null;
    }
  };

  // ヘルパー関数：タグから数値を取得
  const getNumber = (tag) => {
    try {
      const value = dataSet.intString(tag);
      return value ? parseInt(value, 10) : null;
    } catch (e) {
      return null;
    }
  };

  // 主要なメタデータを抽出
  const metadata = {
    // UIDs
    studyInstanceUid: getString('x0020000d') || '',
    seriesInstanceUid: getString('x0020000e') || '',
    sopInstanceUid: getString('x00080018') || '',

    // Patient Information
    patientId: getString('x00100020'),
    patientName: getString('x00100010'),
    patientBirthDate: parseDate(getString('x00100030')),
    patientSex: getString('x00100040'),

    // Study Information
    studyDate: parseDate(getString('x00080020')),
    studyTime: getString('x00080030'),
    studyDescription: getString('x00081030'),
    accessionNumber: getString('x00080050'),

    // Series Information
    modality: getString('x00080060'),
    seriesNumber: getNumber('x00200011'),
    seriesDescription: getString('x0008103e'),

    // Instance Information
    instanceNumber: getNumber('x00200013'),
    rows: getNumber('x00280010'),
    columns: getNumber('x00280011'),
    numberOfFrames: getNumber('x00280008'),

    // Device Information
    manufacturer: getString('x00080070'),
    manufacturerModelName: getString('x00081090'),
    bodyPartExamined: getString('x00180015'),

    // その他の有用な情報
    imageType: getString('x00080008'),
    contentDate: parseDate(getString('x00080023')),
    contentTime: getString('x00080033'),
    acquisitionDate: parseDate(getString('x00080022')),
    acquisitionTime: getString('x00080032'),

    // 全メタデータ（簡略版）
    fullMetadata: {
      note: 'Parsed with dicom-parser (fallback)',
    },
  };

  return metadata;
}

/**
 * DICOMの日付形式（YYYYMMDD）をJavaScript Dateに変換
 * @param {string} dicomDate - DICOM日付文字列
 * @returns {Date|null}
 */
function parseDate(dicomDate) {
  if (!dicomDate || dicomDate.length < 8) return null;
  
  const year = dicomDate.substring(0, 4);
  const month = dicomDate.substring(4, 6);
  const day = dicomDate.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * DICOMの時間形式（HHMMSS.FFFFFF）を文字列に変換
 * @param {string} dicomTime - DICOM時間文字列
 * @returns {string|null}
 */
export function parseDicomTime(dicomTime) {
  if (!dicomTime) return null;
  
  const hours = dicomTime.substring(0, 2);
  const minutes = dicomTime.substring(2, 4);
  const seconds = dicomTime.substring(4, 6);
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * メタデータから表示用のサマリーを生成
 * @param {Object} metadata - パース済みメタデータ
 * @returns {Object} 表示用サマリー
 */
export function generateMetadataSummary(metadata) {
  return {
    patient: {
      name: metadata.patientName || 'Unknown',
      id: metadata.patientId || 'N/A',
      sex: metadata.patientSex || 'N/A',
      birthDate: metadata.patientBirthDate 
        ? new Date(metadata.patientBirthDate).toLocaleDateString() 
        : 'N/A',
    },
    study: {
      description: metadata.studyDescription || 'N/A',
      date: metadata.studyDate 
        ? new Date(metadata.studyDate).toLocaleDateString() 
        : 'N/A',
      time: metadata.studyTime || 'N/A',
      uid: metadata.studyInstanceUid,
    },
    series: {
      modality: metadata.modality || 'N/A',
      description: metadata.seriesDescription || 'N/A',
      number: metadata.seriesNumber || 'N/A',
      uid: metadata.seriesInstanceUid,
    },
    instance: {
      number: metadata.instanceNumber || 'N/A',
      uid: metadata.sopInstanceUid,
    },
  };
}

/**
 * 複数のDICOMファイルをバッチでパース
 * @param {Array<File>} files - DICOMファイルの配列
 * @param {Function} onProgress - 進捗コールバック (current, total)
 * @returns {Promise<Array>} パース済みメタデータの配列
 */
export async function parseDicomFilesInBatch(files, onProgress) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const metadata = parseDicomFile(arrayBuffer);
      
      results.push({
        file,
        metadata,
        status: 'success',
        error: null,
      });
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      results.push({
        file: files[i],
        metadata: null,
        status: 'error',
        error: error.message,
      });
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }
  }
  
  return results;
}

/**
 * DICOMタグの値を編集可能かチェック
 * @param {string} tagName - DICOMタグ名
 * @returns {boolean}
 */
export function isEditableTag(tagName) {
  const editableTags = [
    'PatientName',
    'PatientID',
    'StudyDescription',
    'SeriesDescription',
    'BodyPartExamined',
  ];
  
  return editableTags.includes(tagName);
}

/**
 * メタデータを編集
 * @param {Object} metadata - 元のメタデータ
 * @param {string} fieldName - 編集するフィールド名
 * @param {any} newValue - 新しい値
 * @returns {Object} 編集後のメタデータ
 */
export function editMetadata(metadata, fieldName, newValue) {
  if (!isEditableTag(fieldName)) {
    throw new Error(`Field ${fieldName} is not editable`);
  }
  
  return {
    ...metadata,
    [fieldName.charAt(0).toLowerCase() + fieldName.slice(1)]: newValue,
    fullMetadata: {
      ...metadata.fullMetadata,
      [fieldName]: newValue,
    },
  };
}



