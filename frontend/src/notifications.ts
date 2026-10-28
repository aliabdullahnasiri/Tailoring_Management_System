import type {State,Order} from './types';
export type OrderNotice={id:string;kind:'overdue'|'today'|'ready';order:Order;customer:string};
export function orderNotices(data:State,today:string):OrderNotice[]{
 const customers=new Map(data.customers.map(customer=>[customer.id,customer.name]));
 const notices:OrderNotice[]=[];
 for(const order of data.orders){
  if(order.status==='Delivered')continue;
  const kind=order.due<today?'overdue':order.status==='Ready'?'ready':order.due===today?'today':null;
  if(!kind)continue;
  const readyEvent=kind==='ready'?data.history.filter(event=>event.order_id===order.id&&event.status==='Ready').map(event=>event.created).sort().at(-1)||'':'';
  notices.push({id:JSON.stringify([order.id,kind,order.due,readyEvent]),kind,order,customer:customers.get(order.customer_id)||''});
 }
 const priority={overdue:0,today:1,ready:2};
 return notices.sort((a,b)=>priority[a.kind]-priority[b.kind]||a.order.due.localeCompare(b.order.due)||a.order.number-b.order.number);
}
export function readNoticeIds(value:string|null):string[]{
 try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==='string'):[]}catch{return []}
}
