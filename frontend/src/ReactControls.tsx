import React,{Children,isValidElement,useId,useRef,useState,type ReactNode,type SelectHTMLAttributes,type InputHTMLAttributes} from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import {enGB,faIR} from 'date-fns/locale';
import {CalendarDays} from 'lucide-react';
import {language,t,useLanguage,locale,formatDate} from './i18n';
import 'react-datepicker/dist/react-datepicker.css';
import {parseDate,isoDate} from './date-values';

type ValueEvent={target:{value:string}};
type SelectProps=Omit<SelectHTMLAttributes<HTMLSelectElement>,'onChange'> & {searchable?:boolean;onChange?:(event:ValueEvent)=>void};
function optionText(node:ReactNode):string{return Children.toArray(node).map(child=>isValidElement<{children?:ReactNode}>(child)?optionText(child.props.children):String(child)).join('')}
export function AppSelect({children,value,defaultValue,onChange,name,required,disabled,id,searchable=false,'aria-label':label,'aria-labelledby':labelledBy}:SelectProps){
 useLanguage();const generated=useId(),container=useRef<HTMLDivElement>(null);
 const options=Children.toArray(children).flatMap(child=>isValidElement<{value?:string|number;children?:ReactNode;disabled?:boolean}>(child)?[{value:String(child.props.value??optionText(child.props.children)),label:optionText(child.props.children),isDisabled:!!child.props.disabled}]:[]);
 const [local,setLocal]=useState(()=>String(defaultValue??options[0]?.value??''));
 const current=String(value??local),selected=options.find(option=>option.value===current);
 return <div className="app-select" ref={container}><Select
  unstyled classNamePrefix="rs" inputId={id||generated} instanceId={generated} name={name} required={required} isDisabled={disabled} isSearchable={searchable} isRtl={language()!=='en'}
  aria-label={label} aria-labelledby={labelledBy} options={options} value={selected?.value===''?null:selected||null}
  placeholder={options.find(option=>option.value==='')?.label||t('Select…')} noOptionsMessage={()=>t('No matching results')} loadingMessage={()=>t('Loading…')}
  menuPlacement="auto" menuPortalTarget={document.body} menuPosition="fixed" maxMenuHeight={240} styles={{menuPortal:base=>({...base,zIndex:100})}}
  onChange={option=>{const next=option?.value||'';setLocal(next);container.current?.querySelectorAll('input').forEach(input=>input.setCustomValidity(''));onChange?.({target:{value:next}})}}
 /></div>;
}
type DateProps=Omit<InputHTMLAttributes<HTMLInputElement>,'onChange'|'value'|'defaultValue'> & {value?:string;defaultValue?:string;onChange?:(event:ValueEvent)=>void};
export function AppDatePicker({value,defaultValue,onChange,name,required,min,max,id,disabled,'aria-label':label,'aria-labelledby':labelledBy}:DateProps){
 const lang=useLanguage(),[local,setLocal]=useState(defaultValue||'');
 const container=useRef<HTMLDivElement>(null),calendarOpen=useRef(false);
 const current=value??local;
 const selectedDate=parseDate(current);
 const [editing,setEditing]=useState(false);
 const validate=(input:HTMLInputElement)=>{const raw=input.value;input.setCustomValidity(raw&&(!parseDate(raw)||(min&&raw<String(min))||(max&&raw>String(max)))?t('Enter a valid date in YYYY-MM-DD format.'): '')};
 const calendarLocale=lang==='en'?enGB:{...faIR,localize:{...faIR.localize,day:(index:Parameters<typeof faIR.localize.day>[0],options?:Parameters<typeof faIR.localize.day>[1])=>new Intl.DateTimeFormat(lang==='ps'?'ps-AF':'fa-AF',{weekday:options?.width==='wide'?'long':options?.width==='abbreviated'?'short':'narrow'}).format(new Date(2024,0,7+index)),month:(index:number)=>new Intl.DateTimeFormat(lang==='ps'?'ps-AF-u-ca-gregory':'fa-AF-u-ca-gregory',{month:'long'}).format(new Date(2024,index,1))}};
 return <div className={`app-date${selectedDate&&!editing?' date-chip':''}`} ref={container} onInput={event=>{if(event.target instanceof HTMLInputElement){event.stopPropagation();validate(event.target)}}}><DatePicker id={id} name={name} required={required} disabled={disabled} selected={parseDate(current)} dateFormat="yyyy-MM-dd" strictParsing locale={calendarLocale}
  minDate={min?parseDate(String(min))||undefined:undefined} maxDate={max?parseDate(String(max))||undefined:undefined} placeholderText="YYYY-MM-DD" autoComplete="off" ariaLabelledBy={labelledBy}
  customInput={<input aria-label={label} dir="ltr" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"/>}
  onChange={(date:Date|null)=>{container.current?.querySelector('input')?.setCustomValidity('');const next=isoDate(date);setLocal(next);onChange?.({target:{value:next}})}}
  onChangeRaw={event=>{if(event?.target instanceof HTMLInputElement)validate(event.target)}} onFocus={()=>setEditing(true)} onBlur={event=>{setEditing(false);if(event.target instanceof HTMLInputElement)validate(event.target)}}
  portalId="date-picker-portal" onCalendarOpen={()=>{calendarOpen.current=true}} onCalendarClose={()=>{calendarOpen.current=false}} onKeyDown={event=>{if(event.key==='Escape'&&calendarOpen.current)event.stopPropagation()}} showPopperArrow={false} popperPlacement={lang==='en'?'bottom-start':'bottom-end'} calendarClassName="app-calendar" previousMonthAriaLabel={t('Previous month')} nextMonthAriaLabel={t('Next month')}
 />{selectedDate&&!editing&&<span className="date-chip-copy" aria-hidden="true"><small>{new Intl.DateTimeFormat(locale(),{weekday:'long'}).format(selectedDate)}</small><strong>{formatDate(selectedDate)}</strong></span>}<span className="date-control-icon" aria-hidden="true"><CalendarDays size={20}/></span></div>;
}
