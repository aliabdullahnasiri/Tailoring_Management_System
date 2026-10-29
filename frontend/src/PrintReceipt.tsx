import type {CSSProperties, ReactNode} from 'react';
import {Scissors} from 'lucide-react';
import type {State,Order,Payment,Customer,Profile} from './types';
import {t,language,formatDate,formatNumber,formatTimestamp} from './i18n';
import {paperSize} from './print';

export type PrintRequest={order:Order;payment?:Payment;includeMeasurements?:boolean}|{customer:Customer;profiles:Profile[]};

function PrintPage({data,children}:{data:State;children:ReactNode}){
 const paper=data.settings.receipt_width;
 const {width,height,margin}=paperSize(paper);
 const style={'--paper-width':`${width}mm`,'--paper-height':`${height}mm`,'--print-margin':`${margin}mm`,'--content-width':`${width-margin*2}mm`} as CSSProperties;
 return <article id="receipt" data-paper={paper} dir={language()==='en'?'ltr':'rtl'} className={paper==='80mm'?'narrow':''} style={style}>
  <style>{`@media print { @page { size: ${width}mm ${height}mm; margin: 0; } }`}</style>
  <div className="print-fit"><div className="print-sheet">{children}<footer className="print-footer"><p>{t('Thank you for trusting us with your next perfect fit.')}</p><small>{t('Printed:')} {formatTimestamp(new Date())}</small></footer></div></div>
 </article>;
}
function PrintHeader({data,title,reference}:{data:State;title:string;reference?:string}){
 return <header className="print-brand"><div className="print-shop"><span className="print-mark"><Scissors size={20}/></span><div><h1>{data.settings.name}</h1>{data.settings.address&&<p>{data.settings.address}</p>}{data.settings.phone&&<p><bdi>{data.settings.phone}</bdi></p>}</div></div><div className="print-document"><h2>{t(title)}</h2>{reference&&<bdi className="print-reference">{reference}</bdi>}</div></header>;
}
function CustomerDetails({customer}:{customer?:Customer}){
 return <div><h3>{t('Customer')}</h3><strong>{customer?.name||'—'}</strong>{customer?.phone&&<p><bdi>{customer.phone}</bdi></p>}</div>;
}
function MeasurementBlock({profile,label}:{profile:Profile;label?:string}){
 return <section className="print-measurement"><header><h3>{label||profile.name}</h3><small>{t(profile.kind)} · {t('Version')} {formatNumber(profile.version)} · {t(profile.unit==='cm'?'Centimeters':'Inches')}</small></header><dl className="print-measurement-grid">{Object.entries(profile.values).map(([key,value])=><div key={key}><dt>{t(key)}</dt><dd>{formatNumber(value)} <span>{profile.unit}</span></dd></div>)}</dl>{profile.notes&&<p>{profile.notes}</p>}</section>;
}
export function PrintReceipt({data,request}:{data:State;request:PrintRequest}){
 if('customer' in request)return <PrintPage data={data}><PrintHeader data={data} title="Customer measurements"/><section className="print-info"><CustomerDetails customer={request.customer}/><div><h3>{t('Saved measurement profiles')}</h3><strong>{formatNumber(request.profiles.length)}</strong></div></section>{request.profiles.map(profile=><MeasurementBlock key={profile.id} profile={profile}/>)}{!request.profiles.length&&<p>{t('No measurement profile attached.')}</p>}</PrintPage>;
 const {order,payment}=request;
 const customer=data.customers.find(c=>c.id===order.customer_id);
 const items=data.items.filter(i=>i.order_id===order.id);
 const money=(n:number)=>formatNumber(n)+' ؋';
 const orderNumber='TMS-'+String(order.number).padStart(4,'0');
 const reference=payment?'R-'+payment.id.slice(0,8).toUpperCase():orderNumber;
 const includeMeasurements=!payment&&(request.includeMeasurements??data.settings.print_measurements??false);
 return <PrintPage data={data}>
  <PrintHeader data={data} title={payment?'Payment receipt':'Order receipt'} reference={reference}/>
  <section className="print-info"><CustomerDetails customer={customer}/><dl><div><dt>{t('Order')}</dt><dd><bdi>{orderNumber}</bdi></dd></div><div><dt>{t('Ordered')}</dt><dd>{formatDate(order.ordered)}</dd></div><div><dt>{t('Delivery date')}</dt><dd>{formatDate(order.due)}</dd></div><div><dt>{t('Status')}</dt><dd>{t(order.status)}</dd></div></dl></section>
  <table className="print-items"><thead><tr><th>{t('Item')}</th><th>{t('Qty')}</th><th>{t('Unit price (AFN)')}</th><th>{t('Amount')}</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><strong>{t(i.kind)}</strong>{i.instructions&&<small>{i.instructions}</small>}</td><td>{formatNumber(i.quantity)}</td><td>{money(i.price)}</td><td>{money(i.quantity*i.price)}</td></tr>)}</tbody></table>
  {includeMeasurements&&items.some(i=>i.snapshot)&&<section className="print-measurements"><h2>{t('Customer measurements')}</h2>{items.map((item,index)=>item.snapshot&&<MeasurementBlock key={item.id} profile={item.snapshot} label={`${t('Item')} ${formatNumber(index+1)} · ${item.snapshot.name}`}/>)}</section>}
  <div className="print-bottom"><div className="print-notes">{order.instructions&&<><h3>{t('Order instructions')}</h3><p>{order.instructions}</p></>}{payment&&<section className="print-payment"><h3>{t('Payment receipt')}</h3><dl><div><dt>{t('Payment date:')}</dt><dd>{formatTimestamp(payment.created)}</dd></div><div><dt>{t('Method')}</dt><dd>{t(payment.method)}</dd></div><div><dt>{t('This transaction:')}</dt><dd><strong>{money(payment.amount)}</strong></dd></div></dl>{payment.reverses&&<p>{t('Reversal reason:')} {payment.reason}</p>}</section>}</div><dl className="print-totals"><div><dt>{t('Order total')}</dt><dd>{money(order.total)}</dd></div><div><dt>{t('Total paid (net):')}</dt><dd>{money(order.paid)}</dd></div><div className="print-balance"><dt>{t('Balance')}</dt><dd>{money(order.balance)}</dd></div></dl></div>
 </PrintPage>;
}
