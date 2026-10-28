import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const store=new Map(),events={},root={dataset:{},style:{setProperty:(key,value)=>root[key]=value}};
const context={exports:{},require:()=>({}),localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},document:{documentElement:root},window:{addEventListener:(name,fn)=>events[name]=fn}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/appearance.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {parseAppearance,setAppearance}=context.exports;
test('appearance validates stored values and handles corrupted preferences',()=>{
 for(const raw of [null,'bad','null','{}','{"accent":"invalid","sidebar":"invalid","fixedNavbar":"yes"}']){
  const result=parseAppearance(raw);assert.equal(result.accent,'green');assert.equal(result.sidebar,'default');assert.equal(result.fixedNavbar,false);
 }
});
test('partial updates persist, apply to the document and preserve other settings',()=>{
 setAppearance({accent:'blue'});setAppearance({sidebar:'light',fixedNavbar:true});
 const saved=JSON.parse(store.get('thread-ledger-appearance'));
 assert.deepEqual(saved,{accent:'blue',sidebar:'light',fixedNavbar:true});
 assert.equal(root.dataset.sidebarSurface,'light');assert.equal(root.dataset.fixedNavbar,'true');assert.equal(root['--sidebar-accent'],'#3979cf');
});
test('cross-tab changes and clearing storage update the appearance',()=>{
 events.storage({key:'thread-ledger-appearance',newValue:'{"accent":"rose","sidebar":"dark","fixedNavbar":false}'});
 assert.equal(root.dataset.sidebarSurface,'dark');assert.equal(root['--sidebar-accent'],'#bd4c80');
 events.storage({key:null,newValue:null});assert.equal(root.dataset.sidebarSurface,'default');assert.equal(root.dataset.fixedNavbar,'false');
});
