import {useEffect,useRef,useState} from 'react';

// Keep overlays mounted until the exit animation finishes.
export function useAnimatedClose(onClose:()=>void){
 const [closing,setClosing]=useState(false);
 const callback=useRef(onClose);callback.current=onClose;
 useEffect(()=>{
  if(!closing)return;
  const timer=window.setTimeout(()=>{setClosing(false);callback.current()},180);
  return()=>window.clearTimeout(timer);
 },[closing]);
 return {closing,close:()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){callback.current();return}setClosing(true)},cancel:()=>setClosing(false)};
}
