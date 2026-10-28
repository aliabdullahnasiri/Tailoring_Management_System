import {useAnimatedClose} from './useAnimatedClose';
import {useEffect,useRef,useState} from 'react';
import {Settings,Check,X,Sun,Moon,Monitor,CalendarDays} from 'lucide-react';
import {t,locale,formatDate,useLanguage,setLanguage} from './i18n';
import {setTheme,useTheme} from './theme';
import {accents,defaults,setAppearance,useAppearance} from './appearance';

export function NavbarDate(){
 useLanguage();const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 return <time className="date navbar-date" dateTime={date}><span className="navbar-calendar"><CalendarDays size={19}/></span><span><small>{new Intl.DateTimeFormat(locale(),{weekday:'long'}).format(now)}</small><strong>{formatDate(now)}</strong></span></time>;
}
function Toggle({label,detail,checked,onChange}:{label:string;detail:string;checked:boolean;onChange:(value:boolean)=>void}){
 return <label className="workspace-toggle"><span><strong>{t(label)}</strong><small>{t(detail)}</small></span><input type="checkbox" role="switch" checked={checked} onChange={event=>onChange(event.target.checked)}/></label>;
}
export function WorkspaceSettings({mini,onMiniChange}:{mini:boolean;onMiniChange:(value:boolean)=>void}){
 const theme=useTheme(),appearance=useAppearance(),lang=useLanguage();
 const [open,setOpen]=useState(false);
 const settingsExit=useAnimatedClose(()=>setOpen(false));
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  if(!open)return;
  const node=dialog.current!;node.showModal();
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{node.close();document.body.style.overflow=overflow};
 },[open]);
 const colors=[['green','Green'],['blue','Blue'],['amber','Amber'],['red','Red'],['rose','Rose'],['slate','Slate']] as const;
 return <>
  <button type="button" className="floating-settings" aria-label={t('Workspace settings')} title={t('Workspace settings')} aria-haspopup="dialog" onClick={()=>{settingsExit.cancel();setOpen(true)}}><Settings size={23}/></button>
  <dialog ref={dialog} className={`workspace-settings${settingsExit.closing?' is-closing':''}`} aria-labelledby="workspace-settings-title" onCancel={event=>{event.preventDefault();settingsExit.close()}} onClose={()=>{settingsExit.cancel();setOpen(false)}} onClick={event=>{if(event.target===event.currentTarget){const bounds=event.currentTarget.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)settingsExit.close()}}}>
   <header><div><h2 id="workspace-settings-title">{t('Workspace settings')}</h2><p>{t('Make your workspace feel like yours.')}</p></div><button type="button" className="icon" autoFocus aria-label={t('Close settings')} onClick={()=>settingsExit.close()}><X size={21}/></button></header>
   <div className="workspace-settings-body">
    <section><h3>{t('Appearance')}</h3><p>{t('Choose a theme.')}</p><div className="workspace-choices" role="group" aria-label={t('Theme')}>{([['light','Light',Sun],['dark','Dark',Moon],['system','System',Monitor]] as const).map(([value,label,Icon])=><button type="button" key={value} aria-pressed={theme===value} onClick={()=>setTheme(value)}><Icon size={17}/>{t(label)}</button>)}</div></section>
    <section><h3>{t('Language')}</h3><div className="workspace-choices" role="group" aria-label={t('Language')}>{([['en','English'],['fa','فارسی'],['ps','پښتو']] as const).map(([value,label])=><button type="button" lang={value} key={value} aria-pressed={lang===value} onClick={()=>setLanguage(value)}>{label}</button>)}</div></section>
    <section><h3>{t('Sidebar color')}</h3><p>{t('Choose an accent for your navigation.')}</p><div className="workspace-swatches" role="group" aria-label={t('Sidebar color')}>{colors.map(([value,label])=><button type="button" key={value} style={{background:accents[value]}} title={t(label)} aria-label={t(label)} aria-pressed={appearance.accent===value} onClick={()=>setAppearance({accent:value})}>{appearance.accent===value&&<Check size={19}/>}</button>)}</div></section>
    <section><h3>{t('Sidebar style')}</h3><p>{t('Choose how your sidebar looks.')}</p><div className="workspace-choices sidebar-style-choices" role="group" aria-label={t('Sidebar style')}>{(['default','dark','light','transparent'] as const).map(value=><button type="button" key={value} aria-pressed={appearance.sidebar===value} onClick={()=>setAppearance({sidebar:value})}>{t({default:'Match theme',dark:'Dark',light:'Light',transparent:'Transparent'}[value])}</button>)}</div></section>
    <section className="workspace-switches"><Toggle label="Fixed navbar" detail="Keep navigation visible while scrolling." checked={appearance.fixedNavbar} onChange={value=>setAppearance({fixedNavbar:value})}/><Toggle label="Mini sidebar" detail="Use compact, icon-only navigation on desktop." checked={mini} onChange={onMiniChange}/></section>
    <button type="button" className="secondary workspace-reset" onClick={()=>{setAppearance(defaults);setTheme('system');onMiniChange(false)}}>{t('Reset appearance')}</button><p className="workspace-saved">{t('Preferences are saved in this browser.')}</p>
   </div>
  </dialog>
 </>;
}
