import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/notifications.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {orderNotices,readNoticeIds}=context.exports;
const makeOrder=(id,status,due)=>({id,number:Number(id),customer_id:'c1',status,due});
const data=orders=>({orders,customers:[{id:'c1',name:'Test customer'}],history:[]});
const plain=value=>JSON.parse(JSON.stringify(value));
test('includes actionable orders, deduplicates ready overdue orders, and sorts urgency',()=>{
 const result=orderNotices(data([
  makeOrder('1','Ready','2026-11-01'),makeOrder('2','Pending','2026-10-28'),
  makeOrder('3','Ready','2026-10-27'),makeOrder('4','Delivered','2026-10-20'),
  makeOrder('5','Pending','2026-11-01')
 ]),'2026-10-28');
 assert.deepEqual(plain(result.map(n=>[n.order.id,n.kind])),[['3','overdue'],['2','today'],['1','ready']]);
 assert.equal(result[0].customer,'Test customer');
});
test('today becomes overdue on the next day with a new unread identity',()=>{
 const state=data([makeOrder('1','Pending','2026-10-28')]);
 const current=orderNotices(state,'2026-10-28')[0],next=orderNotices(state,'2026-10-29')[0];
 assert.equal(next.kind,'overdue');assert.notEqual(current.id,next.id);
 assert.equal(next.id,orderNotices(state,'2026-10-30')[0].id);
});
test('a new ready transition produces a new alert; delivery removes it',()=>{
 const state=data([makeOrder('1','Ready','2026-11-01')]);
 state.history=[{order_id:'1',status:'Ready',created:'2026-10-27T10:00:00'}];
 const first=orderNotices(state,'2026-10-28')[0].id;
 state.history.push({order_id:'1',status:'Ready',created:'2026-10-28T11:00:00'});
 assert.notEqual(first,orderNotices(state,'2026-10-28')[0].id);
 state.orders[0].status='Delivered';assert.equal(orderNotices(state,'2026-10-28').length,0);
});
test('read status safely handles absent, corrupted and invalid browser data',()=>{
 for(const value of [null,'broken','null','{}','42'])assert.deepEqual(plain(readNoticeIds(value)),[]);
 assert.deepEqual(plain(readNoticeIds('["one",null,2,"two"]')),['one','two']);
});
