import {useEffect,useRef,useState} from 'react';
import {Bell,CheckCheck,Clock,AlertCircle,PackageCheck,X} from 'lucide-react';
import {t,formatDate,formatNumber} from './i18n';
import type {State} from './types';
import {orderNotices,readNoticeIds} from './notifications';
import './notifications.css';
const localToday=()=>{const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`};
export function Notifications({data,username,onOrder}:{data:State|null;username:string;onOrder:(id:string)=>void}){
 const key=`thread-ledger-notifications:${username}`;
 const load=()=>{try{return readNoticeIds(localStorage.getItem(key))}catch{return []}};
 const [read,setRead]=useState(load),[expanded,setExpanded]=useState(false),[today,setToday]=useState(localToday);
 const container=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const notices=data?orderNotices(data,today):[];
 const readSet=new Set(read),unread=notices.filter(notice=>!readSet.has(notice.id)).length;
 const markRead=(ids:string[])=>{
  const merged=new Set([...read,...load(),...ids]);
  const next=notices.filter(notice=>merged.has(notice.id)).map(notice=>notice.id);
  setRead(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* Reading alerts still works without storage. */}
 };
 useEffect(()=>{
  const timer=setInterval(()=>setToday(localToday()),60000);
  const sync=(event:StorageEvent)=>{if(event.key===key||event.key===null)setRead(load())};
  window.addEventListener('storage',sync);
  return()=>{clearInterval(timer);window.removeEventListener('storage',sync)};
 },[key]);
 useEffect(()=>{
  if(!expanded)return;
  const outside=(event:PointerEvent)=>{if(!container.current?.contains(event.target as Node))setExpanded(false)};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setExpanded(false);trigger.current?.focus()}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[expanded]);
 return <div className="notifications" ref={container} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setExpanded(false)}}>
  <button type="button" ref={trigger} className="notification-trigger" title={t('Notifications')} aria-label={t('Notifications ({count} unread)',{count:formatNumber(unread)})} aria-expanded={expanded} aria-controls="notification-panel" onClick={()=>setExpanded(!expanded)}><Bell size={19}/>{unread>0&&<span className="notification-count" aria-hidden="true">{unread>99?`${formatNumber(99)}+`:formatNumber(unread)}</span>}</button>
  {expanded&&<section id="notification-panel" className="notification-panel" aria-label={t('Notifications')}>
   <header><div><h2>{t('Notifications')}</h2><small>{t('Order reminders')}</small></div><button type="button" className="icon" aria-label={t('Close notifications')} onClick={()=>{setExpanded(false);trigger.current?.focus()}}><X size={18}/></button></header>
   {unread>0&&<button type="button" className="notification-read-all" onClick={()=>markRead(notices.map(notice=>notice.id))}><CheckCheck size={16}/>{t('Mark all as read')}</button>}
   <div className="notification-list">
    {!data?<p className="notification-empty">{t('Loading…')}</p>:notices.length===0?<div className="notification-empty"><Bell size={28}/><h3>{t('No notifications')}</h3><p>{t('Your orders are on track.')}</p></div>:notices.map(notice=>{
     const Icon=notice.kind==='overdue'?AlertCircle:notice.kind==='ready'?PackageCheck:Clock;
     return <button type="button" key={notice.id} className={`notification-item ${readSet.has(notice.id)?'is-read':'is-unread'}`} onClick={()=>{markRead([notice.id]);setExpanded(false);trigger.current?.focus();onOrder(notice.order.id)}}>
      <span className={`notification-symbol ${notice.kind}`}><Icon size={18}/></span><span className="notification-copy"><strong>{t(notice.kind==='overdue'?'Overdue':notice.kind==='ready'?'Ready to collect':'Due today')}{!readSet.has(notice.id)&&<span className="notification-unread-dot" aria-label={t('Unread')}/>}</strong><span><bdi>{notice.customer}</bdi> · <bdi dir="ltr">TMS-{String(notice.order.number).padStart(4,'0')}</bdi></span><small>{t('Due: ')}{formatDate(notice.order.due)}</small></span>
     </button>;
    })}
   </div>
  </section>}
 </div>;
}
