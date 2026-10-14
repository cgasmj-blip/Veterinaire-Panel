import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Archive, X, Save, RefreshCw, PawPrint } from "lucide-react";

type Patient = { id:string; name:string; species:string; breed:string|null; birth_date:string|null; sex:string|null; owner_name:string|null; owner_contact:string|null; created_at:string };
type FormData = {name:string;species:string;breed:string;birth_date:string;sex:string;owner_name:string;owner_contact:string};
const empty:FormData={name:"",species:"",breed:"",birth_date:"",sex:"",owner_name:"",owner_contact:""};
const endpoint="https://pvahrnrtivzbkipborcd.supabase.co/functions/v1/veterinary-patients";
function getToken():string|null {
  try {
    const stored=localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token");
    if(!stored)return null;
    const session=JSON.parse(stored);
    return typeof session.access_token==="string"?session.access_token:null;
  }catch{return null;}
}
async function request(method:string,body?:object){
  const token=getToken();
  if(!token)throw new Error("Session EMS introuvable. Reconnectez-vous à EMS, puis rouvrez le panel vétérinaire.");
  const response=await fetch(endpoint,{method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||"Une erreur est survenue");
  return result;
}
export default function Patients(){
  const [patients,setPatients]=useState<Patient[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [editing,setEditing]=useState<Patient|null>(null);
  const [form,setForm]=useState<FormData|null>(null);
  const load=useCallback(async()=>{setLoading(true);setError("");try{const data=await request("GET");setPatients(data.patients||[]);}catch(e){setError(e instanceof Error?e.message:"Erreur de chargement");}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const filtered=useMemo(()=>patients.filter(p=>[p.name,p.species,p.breed,p.owner_name,p.owner_contact].some(v=>(v||"").toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")))),[patients,query]);
  const open=(p?:Patient)=>{setEditing(p||null);setForm(p?{name:p.name,species:p.species,breed:p.breed||"",birth_date:p.birth_date||"",sex:p.sex||"",owner_name:p.owner_name||"",owner_contact:p.owner_contact||""}:{...empty});setError("");};
  const update=(key:keyof FormData,value:string)=>setForm(current=>current?{...current,[key]:value}:current);
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form)return;setBusy(true);setError("");try{const payload={...form,birth_date:form.birth_date||null};await request(editing?"PATCH":"POST",editing?{id:editing.id,...payload}:payload);setForm(null);setEditing(null);await load();}catch(e){setError(e instanceof Error?e.message:"Enregistrement impossible");}finally{setBusy(false);}};
  const archive=async(p:Patient)=>{if(!window.confirm("Archiver la fiche de "+p.name+" ? Elle ne sera plus visible dans la liste."))return;setBusy(true);setError("");try{await request("DELETE",{id:p.id});await load();}catch(e){setError(e instanceof Error?e.message:"Archivage impossible");}finally{setBusy(false);}};
  const field=(label:string,key:keyof FormData,required=false,type="text")=><label className="patient-field"><span>{label}{required?" *":""}</span><input type={type} value={form?.[key]||""} required={required} maxLength={key==="owner_contact"?180:120} onChange={e=>update(key,e.target.value)}/></label>;
  return <section className="patient-module">
    <div className="patient-toolbar"><div><h2>Registre des patients</h2><p>Fiches des animaux suivis par le service vétérinaire</p></div><button className="patient-primary" onClick={()=>open()}><Plus size={18}/> Ajouter un patient</button></div>
    <div className="patient-search"><Search size={18}/><input aria-label="Rechercher un patient" placeholder="Rechercher un animal, une espèce ou un propriétaire…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>void load()} title="Actualiser"><RefreshCw size={17}/></button></div>
    {error&&<p className="patient-error" role="alert">{error}</p>}
    {loading?<div className="patient-empty">Chargement des patients…</div>:filtered.length===0?<div className="patient-empty"><PawPrint size={32}/><strong>{patients.length?"Aucun résultat":"Aucun patient enregistré"}</strong><span>{patients.length?"Essayez une autre recherche.":"Ajoutez votre premier animal pour commencer."}</span></div>:<div className="patient-list">{filtered.map(p=><article className="patient-row" key={p.id}><div className="patient-symbol"><PawPrint size={22}/></div><div className="patient-identity"><strong>{p.name}</strong><span>{[p.species,p.breed].filter(Boolean).join(" · ")}</span></div><div className="patient-owner"><small>Propriétaire</small><span>{p.owner_name||"Non renseigné"}</span></div><div className="patient-owner"><small>Contact</small><span>{p.owner_contact||"—"}</span></div><div className="patient-actions"><button title="Modifier" aria-label={"Modifier "+p.name} onClick={()=>open(p)}><Pencil size={17}/></button><button title="Archiver" aria-label={"Archiver "+p.name} disabled={busy} onClick={()=>void archive(p)}><Archive size={17}/></button></div></article>)}</div>}
    <p className="patient-count">{filtered.length} patient{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</p>
    {form&&<div className="patient-modal-backdrop" onClick={()=>{if(!busy)setForm(null);}}><div className="patient-modal" role="dialog" aria-modal="true" aria-label={editing?"Modifier un patient":"Ajouter un patient"} onClick={e=>e.stopPropagation()}><div className="patient-modal-header"><h2>{editing?"Modifier la fiche":"Nouveau patient"}</h2><button onClick={()=>setForm(null)} disabled={busy} aria-label="Fermer"><X size={20}/></button></div><form onSubmit={e=>void save(e)}><div className="patient-form-grid">{field("Nom de l’animal","name",true)}{field("Espèce","species",true)}{field("Race","breed")}{field("Date de naissance","birth_date",false,"date")}<label className="patient-field"><span>Sexe</span><select value={form.sex} onChange={e=>update("sex",e.target.value)}><option value="">Non renseigné</option><option value="Mâle">Mâle</option><option value="Femelle">Femelle</option><option value="Inconnu">Inconnu</option></select></label>{field("Nom du propriétaire","owner_name")}{field("Téléphone / contact","owner_contact")}</div><div className="patient-modal-footer"><button type="button" onClick={()=>setForm(null)} disabled={busy}>Annuler</button><button className="patient-primary" type="submit" disabled={busy}><Save size={17}/>{busy?"Enregistrement…":"Enregistrer"}</button></div></form></div></div>}
  </section>;
}