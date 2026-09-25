import {useCallback} from 'react';
import {apiUrl} from '@/constants/Api';
import {useApiResource,requestJSON,cachedJSON} from '@/data/api';
import {normalizeMeals,mondayKey,formatDate} from '@/data/meals';
import type {DayMenu,MealType,SchoolMenu} from '@/data/meals';
export {formatDate};
export type {Nutrition,Menu,DayMenu,SchoolMenu,MealType} from '@/data/meals';
export function useMeals(){
 const resource=useApiResource(apiUrl(`/meals/${mondayKey(new Date())}.json`),normalizeMeals);
 const getMenuForDate=useCallback((date:Date):DayMenu=>resource.data?.allMenus.find(day=>day.date===formatDate(date))||{date:formatDate(date),breakfast:[],lunch:[],dinner:[]},[resource.data]);
 const getNextMeal=useCallback(async()=>{
  if(!resource.data)return null;
  const now=new Date(); const minutes=now.getHours()*60+now.getMinutes();
  const weeks=new Map<string,SchoolMenu|null>([[mondayKey(now),resource.data]]);
  for(let offset=0;offset<7;offset++){
   const date=new Date(now);date.setDate(date.getDate()+offset);const key=mondayKey(date);
   if(!weeks.has(key)){
    const url=apiUrl(`/meals/${key}.json`);
    try {const result=await requestJSON(url);weeks.set(key,result.data?normalizeMeals(result.data):null);}catch{const cached=cachedJSON(url);weeks.set(key,cached?normalizeMeals(cached):null);}
   }
   const day=weeks.get(key)?.allMenus.find(day=>day.date===formatDate(date));if(!day)continue;
   const weekend=date.getDay()===0||date.getDay()===6;
   for(const type of ['breakfast','lunch','dinner'] as MealType[]){
    const end=type==='breakfast'?(weekend?570:510):type==='lunch'?780:1170;
    if(offset===0&&minutes>end)continue;
    if(day[type]?.length)return {meal:day[type],type,date};
   }
  }
  return null;
 },[resource.data]);
 return {schoolMenu:resource.data,loading:resource.loading,error:resource.error,getMenuForDate,getNextMeal,refetch:resource.refresh,ensureWeekForDate:resource.refresh};
}
