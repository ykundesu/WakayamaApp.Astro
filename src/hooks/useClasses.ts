import {useApiResource} from '@/data/api';
import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/constants/Api';
import { useSettings } from '@/contexts/SettingsContext';

export interface ClassItem {
  start: string;
  end: string;
  name: string;
  teacher: string | null;
}

export interface ClassData {
  day: number;
  classes: ClassItem[];
}

// 現在の日付から学期を自動判定
function computeCurrentSemester(now: Date = new Date()): '0' | '1' {
  // 4~8月(4,5,6,7,8)は前期、それ以外(9~3月)は後期
  const monthIndex = now.getMonth(); // 0=1月, 3=4月, 8=9月
  return monthIndex >= 3 && monthIndex <= 7 ? '0' : '1';
}

// 今年度を返す純関数
function getFiscalYear(now: Date = new Date()): number {
  const year = now.getFullYear();
  const fiscalYearStart = new Date(year, 3, 1); // 4/1
  return now >= fiscalYearStart ? year : year - 1;
}

const normalize = (json:any):ClassData[] => Array.isArray(json?.data)?json.data:[];
export function useClasses(){
 const {grade,studentClass,admissionYear,gradeOffset}=useSettings();
 const fiscalYear=getFiscalYear();const year=admissionYear??(fiscalYear-(grade??1)+1);
 const effectiveGrade=Math.max(1,Math.min(5,fiscalYear-year+1+(gradeOffset??0)));
 const resource=useApiResource(apiUrl(`/classes/${year}${studentClass}/${effectiveGrade}_${computeCurrentSemester()}.json`),normalize);
 const allData=resource.data||[];
 const getClassesForDate=useCallback((date:Date)=>allData.find(day=>day.day===(date.getDay()+6)%7)?.classes||[],[resource.data]);
 const getTodayClasses=useCallback(()=>getClassesForDate(new Date()),[getClassesForDate]);
 return {classes:getTodayClasses(),allData,getClassesForDate,getTodayClasses,loading:resource.loading,error:resource.error,refetch:resource.refresh};
}
