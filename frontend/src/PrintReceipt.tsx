import {Scissors} from 'lucide-react';
import type {State,Order,Payment} from './types';
import {t,language,formatDate,formatNumber,formatTimestamp} from './i18n';

export function PrintReceipt({data,order,payment}:{data:State;order:Order;payment?:Payment}){
 const customer=data.customers.find(c=>c.id===order.customer_id);
 const items=data.items.filter(i=>i.order_id===order.id);
 const money=(n:number)=>formatNumber(n)+' ؋';
 const orderNumber='TMS-'+String(order.number).padStart(4,'0');
 const reference=payment?'R-'+payment.id.slice(0,8).toUpperCase():orderNumber;
 return <article id="receipt" dir={language()==='en'?'ltr':'rtl'} className={data.settings.receipt_width==='80mm'?'narrow':''}>
  <header className="print-brand"><div className="print-shop"><span className="print-mark"><Scissors size={25}/></span><div><h1>{data.settings.name}</h1>{data.settings.address&&<p>{data.settings.address}</p>}{data.settings.phone&&<p><bdi>{data.settings.phone}</bdi></p>}</div></div><div className="print-document"><h2>{t(payment?'Payment receipt':'Order receipt')}</h2><bdi className="print-reference">{reference}</bdi></div></header>
  <section className="print-info"><div><h3>{t('Customer')}</h3><strong>{customer?.name||'—'}</strong>{customer?.phone&&<p><bdi>{customer.phone}</bdi></p>}</div><dl><div><dt>{t('Order')}</dt><dd><bdi>{orderNumber}</bdi></dd></div><div><dt>{t('Ordered')}</dt><dd>{formatDate(order.ordered)}</dd></div><div><dt>{t('Delivery date')}</dt><dd>{formatDate(order.due)}</dd></div><div><dt>{t('Status')}</dt><dd>{t(order.status)}</dd></div></dl></section>
  <table className="print-items"><thead><tr><th>{t('Item')}</th><th>{t('Qty')}</th><th>{t('Unit price (AFN)')}</th><th>{t('Amount')}</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><strong>{t(i.kind)}</strong>{i.instructions&&<small>{i.instructions}</small>}</td><td>{formatNumber(i.quantity)}</td><td>{money(i.price)}</td><td>{money(i.quantity*i.price)}</td></tr>)}</tbody></table>
  <div className="print-bottom"><div className="print-notes">{order.instructions&&<><h3>{t('Order instructions')}</h3><p>{order.instructions}</p></>}{payment&&<section className="print-payment"><h3>{t('Payment receipt')}</h3><dl><div><dt>{t('Payment date:')}</dt><dd>{formatTimestamp(payment.created)}</dd></div><div><dt>{t('Method')}</dt><dd>{t(payment.method)}</dd></div><div><dt>{t('This transaction:')}</dt><dd><strong>{money(payment.amount)}</strong></dd></div></dl>{payment.reverses&&<p>{t('Reversal reason:')} {payment.reason}</p>}</section>}</div><dl className="print-totals"><div><dt>{t('Order total')}</dt><dd>{money(order.total)}</dd></div><div><dt>{t('Total paid (net):')}</dt><dd>{money(order.paid)}</dd></div><div className="print-balance"><dt>{t('Balance')}</dt><dd>{money(order.balance)}</dd></div></dl></div>
  <footer className="print-footer"><p>{t('Thank you for trusting us with your next perfect fit.')}</p><small>{t('Printed:')} {formatTimestamp(new Date())}</small></footer>
 </article>;
}
