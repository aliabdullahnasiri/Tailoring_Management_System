export type Customer={id:string;name:string;phone:string;notes:string;created:string};
export type Profile={id:string;customer_id:string;name:string;kind:string;unit:string;values:Record<string,number>;notes:string;version:number;updated:string};
export type Order={id:string;number:number;customer_id:string;ordered:string;due:string;status:string;delivered:string|null;instructions:string;total:number;paid:number;balance:number};
export type Item={id:string;order_id:string;kind:string;quantity:number;price:number;snapshot:Profile|null;instructions:string};
export type Payment={id:string;order_id:string;amount:number;created:string;method:string;reverses:string|null;reason:string};
export type Settings={name:string;phone:string;address:string;language:string;receipt_width:string;print_measurements?:boolean};
export type State={customers:Customer[];profiles:Profile[];orders:Order[];items:Item[];payments:Payment[];history:{id:string;order_id:string;status:string;created:string}[];settings:Settings;fields:Record<string,string[]>};
