import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Search,X,Users,ShoppingBag,Wallet} from 'lucide-react';
import {t,formatNumber} from './i18n';
import type {State} from './types';
import {useAnimatedClose} from './useAnimatedClose';
import './skeleton.css';
import './navbar-search.css';

export function NavbarSearch({data,onCustomer,onOrder}:{data:State;onCustomer:(id:string)=>void;onOrder:(id:string)=>void}){
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState(false),[mobile,setMobile]=useState(()=>matchMedia('(max-width:720px)').matches);
 const root=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const pendingSelection=useRef<(()=>void)|null>(null);
 const exit=useAnimatedClose(()=>{setExpanded(false);const select=pendingSelection.current;pendingSelection.current=null;if(select){setQuery('');select()}});
 const close=()=>{if(mobile)exit.close();else setExpanded(false)};
 const [settledQuery,setSettledQuery]=useState('');
 useEffect(()=>{if(!expanded)return;const timer=window.setTimeout(()=>setSettledQuery(query),700);return()=>window.clearTimeout(timer)},[query,expanded]);
 const loading=Boolean(query.trim())&&query!==settledQuery;
 useEffect(()=>{const media=matchMedia('(max-width:720px)');const change=()=>{setMobile(media.matches);setExpanded(false)};media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 useEffect(()=>{
  if(!expanded)return;
  if(mobile){const previous=document.body.style.overflow;dialog.current?.showModal();input.current?.focus();document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;dialog.current?.close();trigger.current?.focus()}}
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setExpanded(false)};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[expanded,mobile]);
 const term=query.trim().toLowerCase();
 const customers=new Map(data.customers.map(c=>[c.id,c]));
 const orders=new Map(data.orders.map(o=>[o.id,o]));
 const orderNumber=(n:number)=>`TMS-${String(n).padStart(4,'0')}`;
 const records=[
  ...data.customers.map(c=>({id:c.id,group:'Customers',title:c.name,detail:c.phone,search:`${c.name} ${c.phone}`,select:()=>onCustomer(c.id)})),
  ...data.orders.map(o=>({id:o.id,group:'Orders',title:orderNumber(o.number),detail:customers.get(o.customer_id)?.name||'',search:`${orderNumber(o.number)} ${customers.get(o.customer_id)?.name||''} ${customers.get(o.customer_id)?.phone||''}`,select:()=>onOrder(o.id)})),
  ...data.payments.flatMap(p=>{const o=orders.get(p.order_id);if(!o)return [];const c=customers.get(o.customer_id);const receipt=`R-${p.id.slice(0,8).toUpperCase()}`;return [{id:p.id,group:'Payments',title:`${receipt} · ${formatNumber(p.amount)} ؋`,detail:`${c?.name||''} · ${orderNumber(o.number)}`,search:`${receipt} ${p.amount} ${p.method} ${t(p.method)} ${c?.name||''} ${c?.phone||''} ${orderNumber(o.number)}`,select:()=>onOrder(o.id)}]})
 ].filter(r=>term&&r.search.toLowerCase().includes(term));
 const results=<div className="nav-search-results" id="navbar-search-results" aria-busy={loading}>
  {loading?<div role="status" aria-label={t('Loading…')}><span className="visually-hidden">{t('Loading…')}</span><div aria-hidden="true">{[0,1,2].map(i=><div className="nav-search-skeleton" key={i}><span className="skeleton-bone skeleton-avatar"/><div><span className="skeleton-bone skeleton-title"/><span className="skeleton-bone skeleton-short"/></div></div>)}</div></div>:!term?<p>{t('Search customers, orders or payments…')}</p>:!records.length?<p role="status">{t('No results found')}</p>:['Customers','Orders','Payments'].map(group=>{const matches=records.filter(r=>r.group===group);const Icon=group==='Customers'?Users:group==='Orders'?ShoppingBag:Wallet;return matches.length>0&&<section key={group}><h3>{t(group)} · {formatNumber(matches.length)}</h3>{matches.map(r=><button key={r.id} type="button" onClick={()=>{if(mobile){pendingSelection.current=r.select;exit.close()}else{setExpanded(false);setQuery('');r.select()}}}><Icon size={18}/><span><strong>{r.title}</strong><small>{r.detail}</small></span></button>)}</section>})}
 </div>;
 const field=<div className="nav-search-field"><span className="nav-search-symbol" aria-hidden="true"><Search size={19}/></span><input ref={input} type="search" value={query} placeholder={t('Search workspace')} aria-label={t('Search workspace')} aria-controls="navbar-search-results" onFocus={()=>setExpanded(true)} onChange={e=>setQuery(e.target.value)}/></div>;
 return <div ref={root} className={`navbar-search${expanded?' expanded':''}`} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();if(!mobile)input.current?.blur()}}} onBlur={e=>{if(!mobile&&!e.currentTarget.contains(e.relatedTarget))setExpanded(false)}}>
  {mobile?<button ref={trigger} className="icon nav-search-trigger" type="button" aria-label={t('Search workspace')} aria-haspopup="dialog" onClick={()=>{exit.cancel();setExpanded(true)}}><span className="nav-search-symbol" aria-hidden="true"><Search size={19}/></span></button>:<>{field}{expanded&&results}</>}
  {mobile&&expanded&&createPortal(<dialog ref={dialog} className={`nav-search-dialog${exit.closing?' is-closing':''}`} aria-labelledby="nav-search-title" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget)close()}}><div inert={exit.closing}><header><h2 id="nav-search-title">{t('Search workspace')}</h2><button className="icon" type="button" aria-label={t('Close dialog')} onClick={close}><X size={22}/></button></header>{field}{results}</div></dialog>,document.body)}
 </div>;
}
