export type Nutrition = {energyKcal:number|null;proteinG:number|null;fatG:number|null;calciumMg:number|null;saltG:number|null};
export type Menu = {type:string;mainType:string;main:string;subs:string[];nutrition?:Nutrition};
export type DayMenu = {date:string;breakfast:Menu[];lunch:Menu[];dinner:Menu[]};
export type SchoolMenu = {allMenus:DayMenu[]};
export type MealType = 'breakfast'|'lunch'|'dinner';
export function formatDate(date:Date) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function mondayKey(date:Date) {const monday=new Date(date);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);return formatDate(monday);}
export function normalizeMeals(raw:any):SchoolMenu {
 const entries=Array.isArray(raw)?raw:Array.isArray(raw?.allMenus)?raw.allMenus:Array.isArray(raw?.menus)?raw.menus:raw?.date?[raw]:null;
 if(!entries)throw new Error('取得したメニューの形式が正しくありません');
 const days=entries.flatMap((entry:any)=>Array.isArray(entry?.menus)?entry.menus:[entry]);
 return {allMenus:days.filter((day:any)=>typeof day?.date==='string').map((day:any)=>({...day,breakfast:day.breakfast||[],lunch:day.lunch||[],dinner:day.dinner||[]}))};
}
export function missingDay(menu:SchoolMenu|null,date:Date) {return !menu?.allMenus.some(day=>day.date===formatDate(date));}
