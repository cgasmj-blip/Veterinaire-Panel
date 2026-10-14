import {useEffect,useMemo,useState} from "react";
import {CalendarDays,ChevronLeft,ChevronRight,Plus,Clock3} from "lucide-react";
type Patient={id:string;name:string;species:string};
type Appointment={id:string;patient_id:string;starts_at:string;reason:string;status:string;veterinary_patients?:{name:string;species:string}|null};
const base="https://pvahrnrtivzbkipborcd.supabase.co/functions/v1/";
const token=()=>{try{return JSON.parse(localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token")||"{}").access_token as string|undefined}catch{return undefined}};
async function api(path:string,method="GET",body?:object){const auth=token();if(!auth)throw Error("Session EMS absente. Reconnectez-vous à EMS.");const r=await fetch(base+path,{method,headers:{Authorization:"Bearer "+auth,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Erreur de connexion");return d;}
const key=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const statuses:Record<string,string>={a_venir:"À venir",termine:"Terminé",non_presente:"Non présenté",annule:"Annulé"};
export default function Appointments(){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [day,setDay]=useState(()=>key(new Date()));
 const [appointments,setAppointments]=useState<Appointment[]>([]);
 const [patients,setPatients]=useState<Patient[]>([]);
 const [form,setForm]=useState(false);
 const [patient,setPatient]=useState("");
 const [starts,setStarts]=useState("");
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const refresh=async()=>{setLoading(true);try{const [a,p]=await Promise.all([api("veterinary-appointments"),api("veterinary-patients")]);setAppointments(a.appointments||[]);setPatients(p.patients||[]);setError("");}catch(e){setError(e instanceof Error?e.message:"Chargement impossible");}finally{setLoading(false);}};
 useEffect(()=>{void refresh();},[]);
 const days=useMemo(()=>{const first=new Date(month);first.setDate(1-((first.getDay()+6)%7));return Array.from({length:42},(_,i)=>{const d=new Date(first);d.setDate(first.getDate()+i);return d;});},[month]);
 const byDay=useMemo(()=>{const map=new Map<string,Appointment[]>();for(const a of appointments){const k=key(new Date(a.starts_at));map.set(k,[...(map.get(k)||[]),a]);}return map;},[appointments]);
 const selected=byDay.get(day)||[];
 const newAppointment=()=>{setForm(true);setPatient(patients[0]?.id||"");setStarts(day+"T09:00");setReason("");setError("");};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{await api("veterinary-appointments","POST",{patient_id:patient,starts_at:new Date(starts).toISOString(),reason});setForm(false);await refresh();}catch(e){setError(e instanceof Error?e.message:"Création impossible");}finally{setBusy(false);}};
 const change=async(id:string,status:string)=>{setBusy(true);try{await api("veterinary-appointments","PATCH",{id,status});await refresh();}catch(e){setError(e instanceof Error?e.message:"Modification impossible");}finally{setBusy(false);}};
 return <section className="patient-module vet-agenda">
  <div className="patient-toolbar"><div><h2>Agenda vétérinaire</h2><p>Uniquement les rendez-vous des animaux · Synchronisation vers EMS à venir</p></div><button className="patient-primary" onClick={newAppointment}><Plus size={18}/> Nouveau rendez-vous</button></div>
  {error&&<p className="patient-error" role="alert">{error}</p>}
  <div className="vet-calendar-header"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={19}/></button><strong>{month.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</strong><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={19}/></button></div>
  <div className="vet-calendar">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=><div className="vet-weekday" key={d}>{d}</div>)}{days.map(d=>{const k=key(d),items=byDay.get(k)||[];return <button key={k} className={"vet-day "+(day===k?"selected ":"")+(d.getMonth()!==month.getMonth()?"outside":"")} onClick={()=>{setDay(k);setMonth(new Date(d.getFullYear(),d.getMonth(),1));}}><span>{d.getDate()}</span>{items.length>0&&<small>{items.length} RDV</small>}</button>;})}</div>
  <div className="vet-day-details"><h3><CalendarDays size={19}/> {new Date(day+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</h3>{loading?<p>Chargement…</p>:selected.length===0?<p>Aucun rendez-vous ce jour.</p>:selected.map(a=><article key={a.id} className="vet-rdv"><div><strong>{a.veterinary_patients?.name||patients.find(p=>p.id===a.patient_id)?.name||"Animal"}</strong><span><Clock3 size={14}/> {new Date(a.starts_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} · {a.reason||"Consultation"}</span></div><div className="vet-rdv-status"><small>{statuses[a.status]||a.status}</small><select aria-label="Statut du rendez-vous" value={a.status} disabled={busy} onChange={e=>void change(a.id,e.target.value)}><option value="a_venir">À venir</option><option value="termine">Terminé</option><option value="non_presente">Non présenté</option><option value="annule">Annulé</option></select></div></article>)}</div>
  {form&&<div className="patient-modal-backdrop" onClick={()=>!busy&&setForm(false)}><div className="patient-modal" role="dialog" aria-modal="true" aria-label="Nouveau rendez-vous" onClick={e=>e.stopPropagation()}><h2>Nouveau rendez-vous vétérinaire</h2><form onSubmit={e=>void save(e)}><div className="patient-form-grid"><label className="patient-field"><span>Animal *</span><select required value={patient} onChange={e=>setPatient(e.target.value)}>{patients.length===0&&<option value="">Aucun patient</option>}{patients.map(p=><option value={p.id} key={p.id}>{p.name} · {p.species}</option>)}</select></label><label className="patient-field"><span>Date et heure *</span><input required type="datetime-local" value={starts} onChange={e=>setStarts(e.target.value)}/></label><label className="patient-field"><span>Motif</span><input value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} placeholder="Ex. Consultation de contrôle"/></label></div><div className="patient-modal-footer"><button type="button" onClick={()=>setForm(false)}>Annuler</button><button className="patient-primary" type="submit" disabled={busy||!patient}>{busy?"Enregistrement…":"Créer le rendez-vous"}</button></div></form></div></div>}
 </section>;
}