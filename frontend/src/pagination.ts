export function pageBounds(total:number,page:number,size:number){
 const pages=Math.max(1,Math.ceil(total/size));
 const current=Math.min(Math.max(1,page),pages);
 const start=(current-1)*size;
 return {pages,current,start,end:Math.min(start+size,total)};
}
