import {useApiResource} from '@/data/api';
const normalizeClasses=(raw:any):DayClasses[]=>Array.isArray(raw?.data)?raw.data:[];
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudentClass, useSettings } from '@/contexts/SettingsContext';
import { apiUrl } from '@/constants/Api';
import { fetchWithTimeout, getFiscalYear } from '@/utils/classesUtils';
import { DayClasses } from '@/types/classes';

/**
 * useClassesDataフックのパラメータ
 * 
 * 授業データを取得するために必要な設定情報です。
 */
interface UseClassesDataParams {
  /** 選択中の学年（1〜5） */
  selectedGrade: number;
  
  /** 選択中のクラス（A, B, C, D） */
  selectedClass: StudentClass;
  
  /** 選択中の学期（'0'=前期, '1'=後期） */
  selectedSemester: '0' | '1';
  
  /** 選択中の年度（nullの場合は現在の年度を使用） */
  selectedFiscalYear: number | null;
  
  /** 選択中の入学年度（nullの場合は学年から計算） */
  selectedAdmissionYear: number | null;
  
  /** 設定から取得した入学年度（フォールバック用） */
  admissionYear: number | null;
}

/**
 * 授業データ取得カスタムフック
 * 
 * このフックは授業時間割データの取得、キャッシュ管理、
 * エラーハンドリングを一元的に処理します。
 * 
 * 主な機能:
 * - APIからの授業データ取得
 * - AsyncStorageを使用したキャッシュ管理
 * - ネットワークエラー時のキャッシュフォールバック
 * - プルリフレッシュ対応
 * - データの依存関係の最適化
 * 
 * @param params - 授業データ取得に必要なパラメータ
 * @returns 授業データと関連する状態・関数
 * 
 * @example
 * ```typescript
 * const {
 *   loading,
 *   error,
 *   allData,
 *   isCache,
 *   refetch
 * } = useClassesData({
 *   selectedGrade: 3,
 *   selectedClass: 'B',
 *   selectedSemester: '0',
 *   selectedFiscalYear: null,
 *   selectedAdmissionYear: null,
 *   admissionYear: 2023
 * });
 * ```
 */
export function useClassesData({
  selectedGrade,
  selectedClass,
  selectedSemester,
  selectedFiscalYear,
  selectedAdmissionYear,
  admissionYear,
}: UseClassesDataParams) {
  const {gradeOffset}=useSettings();
  // === API URLとキャッシュキーの計算 ===
  
  /**
   * APIリクエストに必要なパラメータをメモ化
   * 
   * 年度、入学年度、学年から実際の学年を計算し、
   * APIのURLとキャッシュキーを生成します。
   * 
   * 依存配列の変更時のみ再計算されるため、パフォーマンスが最適化されています。
   */
  const params = useMemo(() => {
    // 年度の決定（指定がなければ現在の年度を使用）
    const fiscalYear = selectedFiscalYear ?? getFiscalYear();
    
    // 入学年度の決定（優先順位: 選択中 > 設定 > 学年から逆算）
    const effectiveAdmissionYear = (selectedAdmissionYear ?? admissionYear) ?? (fiscalYear - (selectedGrade - 1));
    
    // 基準学年を計算（年度 - 入学年度 + 1）
    // 例: 2025年度、2023年入学 → 3年生
    const computedGradeBase = Math.max(1, Math.min(5, fiscalYear - effectiveAdmissionYear + 1));

    // 学年調整（オフセット）を適用
    const computedGrade = Math.max(1, Math.min(5, computedGradeBase + (gradeOffset ?? 0)));
    
    // APIのディレクトリ名（例: "2023B"）
    const dirName = `${effectiveAdmissionYear}${selectedClass.toUpperCase()}`;
    
    // APIのファイル名（例: "3_0.json" = 3年生の前期）
    const fileName = `${computedGrade}_${selectedSemester}.json`;
    
    // 完全なAPI URL
    const url = apiUrl(`/classes/${dirName}/${fileName}`);
    
    // AsyncStorageのキャッシュキー
    const cacheKey = `cache_classes:${url}`;
    
    return { fiscalYear, effectiveAdmissionYear, computedGrade, dirName, fileName, url, cacheKey };
  }, [selectedFiscalYear, selectedAdmissionYear, admissionYear, selectedGrade, selectedClass, selectedSemester, gradeOffset]);

  const resource=useApiResource(params.url,normalizeClasses);
  const loadClasses=useCallback(async (_showLoading:boolean)=>{},[]);
  return {loading:resource.loading,error:resource.error,allData:resource.data||[],isCache:resource.status===0&&!!resource.data,lastUpdatedAt:null,refreshing:resource.loading,refetch:resource.refresh,loadClasses};
}
