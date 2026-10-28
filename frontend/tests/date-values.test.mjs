import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/date-values.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {parseDate,isoDate}=context.exports;
test('dates round-trip as local calendar dates without UTC shifts',()=>{
 for(const value of ['2026-10-28','2024-02-29','2026-01-01','0099-12-31'])assert.equal(isoDate(parseDate(value)),value);
 assert.equal(isoDate(null),'');
});
test('invalid, overflowing and partial dates are rejected',()=>{
 for(const value of ['','2026-02-29','2026-04-31','2026-13-01','2026-00-10','2026-01-00','2026-1-2','not a date'])assert.equal(parseDate(value),null);
});
