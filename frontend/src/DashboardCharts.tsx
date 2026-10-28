import {useState} from 'react';
import {BarChart3,PieChart} from 'lucide-react';
import type {State} from './types';
import {t,formatDate,formatNumber,useLanguage} from './i18n';

export function DashboardCharts({data}:{data:State}){
 useLanguage();
 const [dayIndex,setDayIndex]=useState<number|null>(null),[statusIndex,setStatusIndex]=useState<number|null>(null);
 const days=Array.from({length:7},(_,i)=>{
  const date=new Date();date.setDate(date.getDate()-6+i);
  const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const orders=data.orders.filter(o=>o.ordered.slice(0,10)===key);
  return {date,count:orders.length,total:orders.reduce((sum,o)=>sum+o.total,0)};
 });
 const peak=Math.max(1,...days.map(d=>d.count));
 const statuses=['Pending','In progress','Ready','Delivered'];
 const colors=['#c69548','#628fc4','#78a36a','#8c7ab8'];
 let offset=0;
 const segments=statuses.map((status,i)=>{
  const orders=data.orders.filter(o=>o.status===status),count=orders.length,start=offset;
  const share=data.orders.length?count/data.orders.length*100:0;offset+=share;
  return {status,count,color:colors[i],start,share,balance:orders.reduce((sum,o)=>sum+o.balance,0)};
 });
 const day=dayIndex===null?null:days[dayIndex],status=statusIndex===null?null:segments[statusIndex];
 const money=(n:number)=>formatNumber(n)+' ؋';
 return <div className="dashboard-charts">
  <section className="card"><div className="card-heading"><div><h2 className="chart-title"><BarChart3 size={18} aria-hidden="true"/>{t('Orders this week')}</h2><p>{t('Last 7 days')}</p></div><strong>{formatNumber(days.reduce((sum,d)=>sum+d.count,0))}</strong></div>
   <div className="weekly-chart" onMouseLeave={()=>setDayIndex(null)}>{days.map(({date,count,total},i)=><button type="button" className={`weekly-column${dayIndex===i?' chart-active':''}`} key={date.toDateString()} onMouseEnter={()=>setDayIndex(i)} onFocus={()=>setDayIndex(i)} onBlur={()=>setDayIndex(null)} onClick={()=>setDayIndex(i)} aria-label={`${formatDate(date)}: ${t('Orders')} ${formatNumber(count)}, ${t('Order value')} ${money(total)}`}><strong>{formatNumber(count)}</strong><span className="weekly-track"><span style={{height:`${count/peak*100}%`}}/></span><small>{formatDate(date).replace(/\s+[۰-۹0-9]{4}$/, '')}</small></button>)}</div>
   <div className="chart-details" role="status">{day?<><strong>{formatDate(day.date)}</strong><span>{t('Orders')}: {formatNumber(day.count)} · {t('Order value')}: {money(day.total)}</span></>:<span>{t('Hover or tap to see details')}</span>}</div>
  </section>
  <section className="card"><div className="card-heading"><h2 className="chart-title"><PieChart size={18} aria-hidden="true"/>{t('Order status')}</h2><span className="muted">{t('All time')}</span></div>
   <div className="status-chart" onMouseLeave={()=>setStatusIndex(null)}><div className="interactive-donut"><svg viewBox="0 0 120 120" aria-label={t('Order status')}><circle cx="60" cy="60" r="48" fill="none" stroke="var(--field-border)" strokeWidth="16"/>{segments.filter(s=>s.count>0).map(s=>{const i=statuses.indexOf(s.status);return <circle key={s.status} cx="60" cy="60" r="48" fill="none" stroke={s.color} strokeWidth={statusIndex===i?20:16} pathLength="100" strokeDasharray={`${s.share} ${100-s.share}`} strokeDashoffset={-s.start} transform="rotate(-90 60 60)" className="donut-segment" tabIndex={0} role="button" aria-label={`${t(s.status)}: ${formatNumber(s.count)}, ${formatNumber(Math.round(s.share))}%`} onMouseEnter={()=>setStatusIndex(i)} onFocus={()=>setStatusIndex(i)} onBlur={()=>setStatusIndex(null)} onClick={()=>setStatusIndex(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setStatusIndex(i)}}}/>})}</svg><div className="donut-caption"><strong>{formatNumber(status?.count??data.orders.length)}</strong><small>{t(status?.status??'Orders')}</small></div></div>
    <ul>{segments.map((s,i)=><li key={s.status}><button type="button" className={statusIndex===i?'chart-active':''} onMouseEnter={()=>setStatusIndex(i)} onFocus={()=>setStatusIndex(i)} onBlur={()=>setStatusIndex(null)} onClick={()=>setStatusIndex(i)}><i style={{background:s.color}}/><span>{t(s.status)}</span><strong>{formatNumber(s.count)}</strong></button></li>)}</ul>
   </div>
   <div className="chart-details" role="status">{status?<><strong>{t(status.status)} · {formatNumber(Math.round(status.share))}%</strong><span>{t('Orders')}: {formatNumber(status.count)} · {t('Outstanding balance')}: {money(status.balance)}</span></>:<span>{t('Hover or tap to see details')}</span>}</div>
  </section>
 </div>;
}
