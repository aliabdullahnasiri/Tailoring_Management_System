import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/pagination.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {pageBounds}=context.exports;
test('every record appears once across pages, including a partial final page',()=>{
 const items=Array.from({length:27},(_,i)=>i);
 const visible=[];
 for(let page=1;page<=3;page++){const {start,end}=pageBounds(items.length,page,10);visible.push(...items.slice(start,end))}
 assert.deepEqual(visible,items);
 assert.equal(pageBounds(27,3,10).end,27);
});
test('exact multiples do not create an extra empty page',()=>{
 assert.equal(pageBounds(20,2,10).pages,2);
 assert.equal(pageBounds(20,3,10).current,2);
});
test('shrinking results clamp to a valid page and empty results stay safe',()=>{
 assert.equal(pageBounds(3,8,10).current,1);
 const empty=pageBounds(0,8,10);
 assert.equal(empty.start,0);assert.equal(empty.end,0);assert.equal(empty.pages,1);
 assert.equal(pageBounds(100,-1,10).current,1);
});
test('all offered page sizes partition the complete result set',()=>{
 for(const size of [5,10,25,50]){
  const total=103;let count=0;
  for(let page=1;page<=Math.ceil(total/size);page++){
   const {start,end}=pageBounds(total,page,size);assert.ok(end-start<=size);count+=end-start;
  }
  assert.equal(count,total);
 }
});
