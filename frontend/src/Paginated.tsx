import {useState,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight} from 'lucide-react';
import {t,formatNumber} from './i18n';
import {pageBounds} from './pagination';
import './pagination.css';
export function Paginated<T>({items,resetKey,initialSize=10,children}:{items:T[];resetKey:string;initialSize?:number;children:(visible:T[])=>ReactNode}){
 const [size,setSize]=useState(initialSize);
 const [position,setPosition]=useState({key:resetKey,page:1});
 const bounds=pageBounds(items.length,position.key===resetKey?position.page:1,size);
 if(position.key!==resetKey||position.page!==bounds.current)setPosition({key:resetKey,page:bounds.current});
 const go=(page:number)=>setPosition({key:resetKey,page});
 return <>{children(items.slice(bounds.start,bounds.end))}{items.length>0&&<nav className="pagination" aria-label={t('Table pagination')}>
  <span className="pagination-summary" role="status">{t('Showing {from}–{to} of {total}',{from:formatNumber(bounds.start+1),to:formatNumber(bounds.end),total:formatNumber(items.length)})}</span>
  <label className="pagination-size"><span>{t('Rows per page')}</span><select value={size} onChange={event=>{setSize(Number(event.target.value));go(1)}}>{[5,10,25,50].map(value=><option value={value} key={value}>{formatNumber(value)}</option>)}</select></label>
  <div className="pagination-controls">
   <button type="button" className="icon" aria-label={t('First page')} title={t('First page')} disabled={bounds.current===1} onClick={()=>go(1)}><ChevronsLeft size={17}/></button>
   <button type="button" className="icon" aria-label={t('Previous page')} title={t('Previous page')} disabled={bounds.current===1} onClick={()=>go(bounds.current-1)}><ChevronLeft size={17}/></button>
   <span>{t('Page {page} of {pages}',{page:formatNumber(bounds.current),pages:formatNumber(bounds.pages)})}</span>
   <button type="button" className="icon" aria-label={t('Next page')} title={t('Next page')} disabled={bounds.current===bounds.pages} onClick={()=>go(bounds.current+1)}><ChevronRight size={17}/></button>
   <button type="button" className="icon" aria-label={t('Last page')} title={t('Last page')} disabled={bounds.current===bounds.pages} onClick={()=>go(bounds.pages)}><ChevronsRight size={17}/></button>
  </div>
 </nav>}</>;
}
