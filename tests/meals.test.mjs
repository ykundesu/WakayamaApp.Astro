import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMeals,mondayKey,missingDay} from '../src/data/meals.ts';
test('週のキーは日曜日・年境界でも月曜日になる',()=>{
 assert.equal(mondayKey(new Date(2026,0,4)), '2025-12-29');
 assert.equal(mondayKey(new Date(2026,0,5)), '2026-01-05');
});
test('既存APIの週・ネストされた週・日付単体を受け取る',()=>{
 const day={date:'2026-01-27',breakfast:[],lunch:[],dinner:[]};
 for(const data of [{menus:[day]},{allMenus:[{menus:[day]}]},day,[day]]) assert.deepEqual(normalizeMeals(data),{allMenus:[day]});
});
test('食事が空の既存日と、日付そのものの欠落を区別する',()=>{
 const menu=normalizeMeals({menus:[{date:'2026-01-27'}]});
 assert.equal(missingDay(menu,new Date(2026,0,27)),false);
 assert.equal(missingDay(menu,new Date(2026,0,28)),true);
 assert.equal(missingDay(null,new Date(2026,0,27)),true);
 assert.throws(()=>normalizeMeals({error:'bad payload'}));
});
