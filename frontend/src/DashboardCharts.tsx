import type {State} from './types';
import {t,formatDate,formatNumber,useLanguage} from './i18n';

export function DashboardCharts({data}:{data:State}){
 useLanguage();
 const days=Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()-6+i);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;return {date,count:data.orders.filter(o=>o.ordered.slice(0,10)===key).length}});
 const peak=Math.max(1,...days.map(d=>d.count));
 const statuses=['Pending','In progress','Ready','Delivered'];
 const colors=['#c69548','#628fc4','#78a36a','#8c7ab8'];
 let offset=0;
 const segments=statuses.map((status,i)=>{const count=data.orders.filter(o=>o.status===status).length;const start=offset;offset+=data.orders.length?count/data.orders.length*100:0;return {status,count,color:colors[i],start,end:offset}});
 return <div className="dashboard-charts"><section className="card"><div className="card-heading"><div><h2>{t('Orders this week')}</h2><p>{t('Last 7 days')}</p></div><strong>{formatNumber(days.reduce((sum,d)=>sum+d.count,0))}</strong></div><div className="weekly-chart">{days.map(({date,count})=><div className="weekly-column" key={date.toDateString()}><strong>{formatNumber(count)}</strong><div className="weekly-track"><div style={{height:`${count/peak*100}%`}}/></div><small>{formatDate(date).replace(/\s+[۰-۹0-9]{4}$/, '')}</small></div>)}</div></section><section className="card"><div className="card-heading"><h2>{t('Order status')}</h2><span className="muted">{t('All time')}</span></div><div className="status-chart"><div className="status-donut" role="img" aria-label={segments.map(s=>`${t(s.status)}: ${formatNumber(s.count)}`).join(', ')} style={{background:data.orders.length?`conic-gradient(${segments.map(s=>`${s.color} ${s.start}% ${s.end}%`).join(',')})`:'var(--field-border)'}}><div><strong>{formatNumber(data.orders.length)}</strong><small>{t('Orders')}</small></div></div><ul>{segments.map(s=><li key={s.status}><i style={{background:s.color}}/><span>{t(s.status)}</span><strong>{formatNumber(s.count)}</strong></li>)}</ul></div></section></div>;
}
