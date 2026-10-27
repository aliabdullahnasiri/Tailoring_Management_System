import {t} from './i18n';
import './skeleton.css';

function Bone({kind='line'}:{kind?:string}) {
 return <span className={`skeleton-bone skeleton-${kind}`}/>;
}
function Stats({count=3}:{count?:number}) {
 return <div className={`stat-grid ${count===3?'three':''}`}>{Array.from({length:count},(_,i)=><div className="stat-card" key={i}><Bone kind="short"/><Bone kind="number"/><Bone/></div>)}</div>;
}
function Table() {
 return <div className="card"><div className="skeleton-toolbar"><Bone kind="title"/><Bone kind="control"/></div><div className="skeleton-table">{Array.from({length:5},(_,i)=><div className="skeleton-row" key={i}>{Array.from({length:4},(_,j)=><Bone key={j}/>)}</div>)}</div></div>;
}
function Form({fields=4}:{fields?:number}) {
 return <div className="card settings-card"><Bone kind="title"/>{Array.from({length:fields},(_,i)=><div className="skeleton-field" key={i}><Bone kind="short"/><Bone kind="control"/></div>)}<Bone kind="button"/></div>;
}
export function PageSkeleton({page}:{page:string}) {
 return <div className="page-skeleton" role="status" aria-label={t('Loading {page}…',{page:t(page)})}>
  <span className="visually-hidden">{t('Loading {page}…',{page:t(page)})}</span>
  <div aria-hidden="true">
   {page==='Dashboard'?<><Stats count={4}/><div className="dashboard-grid"><Table/><div className="side-stack"><Form fields={1}/><Form fields={1}/></div></div></>:
    page==='Customers'?<div className="card"><div className="skeleton-toolbar"><Bone kind="title"/><Bone kind="control"/></div><div className="customer-grid">{Array.from({length:6},(_,i)=><div className="customer-card" key={i}><Bone kind="avatar"/><Bone kind="title"/><Bone/><Bone kind="short"/></div>)}</div></div>:
    page==='Settings'?<div className="settings-grid"><Form fields={5}/><div className="side-stack"><Form fields={1}/><Form fields={2}/></div></div>:
    page==='Payments'?<><Stats/><Table/><div className="spaced"><Table/></div></>:
    page==='Reports'?<><div className="card report-range"><Bone kind="title"/><Bone kind="control"/></div><Stats/><Table/></>:
    <Table/>}
  </div>
 </div>;
}
export function AccountSkeleton(){
 return <div className="account-skeleton" role="status" aria-label={t('Loading…')}><span className="visually-hidden">{t('Loading…')}</span><div aria-hidden="true"><Form fields={2}/></div></div>;
}
