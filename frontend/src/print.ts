type PrintWindow = Window & {__TMS_PRINT_RECEIPT__?: () => Promise<void>};

export function paperSize(paper:string) {
 if(paper==='a5')return {width:148,height:210,margin:6};
 if(paper==='80mm')return {width:80,height:297,margin:4};
 return {width:210,height:297,margin:8};
}

export function fitReceiptToPage() {
 const receipt=document.getElementById('receipt');
 const sheet=receipt?.querySelector<HTMLElement>('.print-sheet');
 if(!receipt||!sheet)return;
 const {width,height,margin}=paperSize(receipt.dataset.paper||'a4');
 receipt.classList.add('print-measuring');
 try{
  const measuredWidth=sheet.getBoundingClientRect().width;
  const measuredHeight=sheet.scrollHeight;
  if(!measuredWidth||!measuredHeight)return;
  const pixelsPerMm=measuredWidth/(width-margin*2);
  const availableHeight=(height-margin*2)*pixelsPerMm-2;
  const scale=Math.min(1,availableHeight/measuredHeight,(measuredWidth-2)/Math.max(measuredWidth,sheet.scrollWidth));
  receipt.style.setProperty('--fit-scale',String(scale));
  receipt.style.setProperty('--fit-width',`${measuredWidth*scale}px`);
  receipt.style.setProperty('--fit-height',`${measuredHeight*scale}px`);
 }finally{receipt.classList.remove('print-measuring')}
}

// Recalculate for browser printing as well as the receipt buttons.
window.addEventListener('beforeprint',fitReceiptToPage);
export async function printReceipt() {
 await document.fonts.ready;
 fitReceiptToPage();
 const desktopPrint=(window as PrintWindow).__TMS_PRINT_RECEIPT__;
 if(desktopPrint)await desktopPrint();
 else window.print();
}
