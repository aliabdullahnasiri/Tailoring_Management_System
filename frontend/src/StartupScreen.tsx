import {Scissors,ShieldCheck,AlertCircle} from 'lucide-react';
import {t} from './i18n';
import './startup.css';
export function StartupScreen({message,error,onRetry}:{message:string;error?:string;onRetry:()=>void}){
 return <div className="startup-screen"><main className="startup-content">
  <div className="startup-mark" aria-hidden="true"><Scissors size={38}/></div>
  <h1>{t('Tailor Studio')}</h1><p className="startup-tagline">{t('Tailoring management, made personal.')}</p>
  {error?<div className="startup-error"><AlertCircle size={20}/><p role="alert">{t(error)}</p><button type="button" className="primary" onClick={onRetry}>{t('Try again')}</button></div>:<div className="startup-progress" role="status"><div className="startup-track" aria-hidden="true"><span/></div><p>{t(message)}</p></div>}
  <div className="startup-note"><ShieldCheck size={15}/><span>{t('Your craft. Your customers.')}</span></div>
 </main></div>;
}
