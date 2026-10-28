import {useSyncExternalStore} from 'react';
export const accents={green:'#648854',blue:'#3979cf',amber:'#b78325',red:'#c14e48',rose:'#bd4c80',slate:'#69788b'} as const;
export type Appearance={accent:keyof typeof accents;sidebar:'default'|'dark'|'light'|'transparent';fixedNavbar:boolean};
export const defaults:Appearance={accent:'green',sidebar:'default',fixedNavbar:false};
export function parseAppearance(raw:string|null):Appearance{
 try{const value=JSON.parse(raw||'{}');return {accent:value&&Object.hasOwn(accents,value.accent)?value.accent:defaults.accent,sidebar:['default','dark','light','transparent'].includes(value?.sidebar)?value.sidebar:defaults.sidebar,fixedNavbar:typeof value?.fixedNavbar==='boolean'?value.fixedNavbar:defaults.fixedNavbar}}catch{return {...defaults}}
}
const key='thread-ledger-appearance';
let current={...defaults};
try{current=parseAppearance(localStorage.getItem(key))}catch{/* Keep defaults when storage is unavailable. */}
const listeners=new Set<()=>void>();
function apply(){
 document.documentElement.dataset.sidebarSurface=current.sidebar;
 document.documentElement.dataset.fixedNavbar=String(current.fixedNavbar);
 document.documentElement.style.setProperty('--sidebar-accent',accents[current.accent]);
}
export function setAppearance(change:Partial<Appearance>){
 current=parseAppearance(JSON.stringify({...current,...change}));
 try{localStorage.setItem(key,JSON.stringify(current))}catch{/* Changes remain usable for this session. */}
 apply();listeners.forEach(listener=>listener());
}
export function useAppearance(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}},()=>current,()=>defaults)}
window.addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;current=parseAppearance(event.newValue);apply();listeners.forEach(listener=>listener())});
apply();
