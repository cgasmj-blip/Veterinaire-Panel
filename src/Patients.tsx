import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Archive, X, Save, RefreshCw, PawPrint, ImagePlus } from "lucide-react";

type Patient = { id:string; name:string; species:string; breed:string|null; birth_date:string|null; sex:string|null; owner_name:string|null; owner_contact:string|null; created_at:string; photo_path:string|null; is_alive:boolean };
type FormData = {name:string;species:string;breed:string;birth_date:string;sex:string;owner_name:string;owner_contact:string;is_alive:boolean};
const empty:FormData={name:"",species:"",breed:"",birth_date:"",sex:"",owner_name:"",owner_contact:"",is_alive:true};
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
  const [category,setCategory]=useState("Tous");
  const [photoFile,setPhotoFile]=useState<File|null>(null);
  const [photoPreview,setPhotoPreview]=useState<string|null>(null);
  const [photos,setPhotos]=useState<Record<string,string>>({});
  const [editing,setEditing]=useState<Patient|null>(null);
  const [form,setForm]=useState<FormData|null>(null);
  const [unknownAge,setUnknownAge]=useState(false);
  const load=useCallback(async()=>{setLoading(true);setError("");try{const data=await request("GET");setPatients(data.patients||[]);}catch(e){setError(e instanceof Error?e.message:"Erreur de chargement");}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    let active=true;
    const token=getToken();
    if(!token)return;
    for(const patient of patients.filter(p=>p.photo_path)){
      fetch(endpoint+"?photo="+encodeURIComponent(patient.id),{headers:{Authorization:"Bearer "+token}})
        .then(r=>r.ok?r.json():null).then(data=>{if(active&&data?.url)setPhotos(prev=>({...prev,[patient.id]:data.url}));}).catch(()=>{});
    }
    return ()=>{active=false;};
  },[patients]);
  useEffect(()=>()=>{if(photoPreview)URL.revokeObjectURL(photoPreview);},[photoPreview]);
  const setImage=(file:File)=>{
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setError("Utilisez une image PNG, JPG ou WebP.");return;}
    if(file.size>5*1024*1024){setError("La photo doit faire moins de 5 Mo.");return;}
    setPhotoFile(file);setPhotoPreview(URL.createObjectURL(file));setError("");
  };
  const onPaste=(event:React.ClipboardEvent)=>{
    const file=Array.from(event.clipboardData.items).find(item=>item.type.startsWith("image/"))?.getAsFile();
    if(file){event.preventDefault();setImage(file);}
  };
  const uploadPhoto=async(id:string,file:File)=>{
    const token=getToken();
    if(!token)throw new Error("Session EMS introuvable");
    const response=await fetch(endpoint+"?upload=1&patient="+encodeURIComponent(id),{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":file.type},body:file});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||"Photo non enregistrée");
    if(result.url)setPhotos(prev=>({...prev,[id]:result.url}));
  };
  const categoryOf=(species:string)=>{const value=species.trim().toLocaleLowerCase("fr");if(/chien|canin|dog/.test(value))return "Chien";if(/chat|félin|felin|cat/.test(value))return "Chat";if(/lapin|rongeur|hamster|cochon d.inde|furet|oiseau|perroquet|reptile|serpent|lézard|lezard|tortue|nac|souris|rat|chinchilla/.test(value))return "NAC";return "Autre";};
  const filtered=useMemo(()=>patients.filter(p=>(category==="Tous"||categoryOf(p.species)===category)&&(!query.trim()||(p.owner_name||"").toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr")))).sort((a,b)=>a.name.localeCompare(b.name,"fr",{sensitivity:"base"})),[patients,query,category]);
  const ageOf=(date:string|null)=>{if(!date)return "Âge inconnu";const born=new Date(date+"T12:00:00"),today=new Date();let years=today.getFullYear()-born.getFullYear();let months=today.getMonth()-born.getMonth();if(today.getDate()<born.getDate())months--;if(months<0){years--;months+=12;}return years<0?"Date à vérifier":years===0?months+" mois":years+" an"+(years>1?"s":"");};
  const open=(p?:Patient)=>{setUnknownAge(!p?.birth_date);setEditing(p||null);setPhotoFile(null);setPhotoPreview(null);setForm(p?{name:p.name,species:p.species,breed:p.breed||"",birth_date:p.birth_date||"",sex:p.sex||"",owner_name:p.owner_name||"",owner_contact:p.owner_contact||"",is_alive:p.is_alive!==false}:{...empty});setError("");};
  const update=(key:Exclude<keyof FormData,"is_alive">,value:string)=>{if(key==="birth_date"&&value)setUnknownAge(false);setForm(current=>current?{...current,[key]:value}:current);};
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form)return;setBusy(true);setError("");try{const payload={...form,birth_date:form.birth_date||null};const result=await request(editing?"PATCH":"POST",editing?{id:editing.id,...payload}:payload);if(photoFile)await uploadPhoto(result.patient.id,photoFile);setForm(null);setPhotoFile(null);setPhotoPreview(null);setEditing(null);await load();}catch(e){setError(e instanceof Error?e.message:"Enregistrement impossible");}finally{setBusy(false);}};
  const archive=async(p:Patient)=>{if(!window.confirm("Archiver la fiche de "+p.name+" ? Elle ne sera plus visible dans la liste."))return;setBusy(true);setError("");try{await request("DELETE",{id:p.id});await load();}catch(e){setError(e instanceof Error?e.message:"Archivage impossible");}finally{setBusy(false);}};
  const field=(label:string,key:Exclude<keyof FormData,"is_alive">,required=false,type="text")=><label className="patient-field"><span>{label}{required?" *":""}</span><input type={type} value={form?.[key]||""} required={required} maxLength={key==="owner_contact"?180:120} onChange={e=>update(key,e.target.value)}/></label>;
  return <section className="patient-module">
    <div className="patient-toolbar"><div><h2>Registre des patients</h2><p>Fiches des animaux suivis par le service vétérinaire</p></div><button className="patient-primary" onClick={()=>open()}><Plus size={18}/> Ajouter un patient</button></div>
    <div className="patient-filters" role="group" aria-label="Filtrer par type d’animal">{["Tous","Chien","Chat","NAC","Autre"].map(c=><button type="button" key={c} className={category===c?"active":""} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="patient-search"><Search size={18}/><input aria-label="Rechercher par propriétaire" placeholder="Rechercher par nom du propriétaire…" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>void load()} title="Actualiser"><RefreshCw size={17}/></button></div>
    {error&&<p className="patient-error" role="alert">{error}</p>}
    {loading?<div className="patient-empty">Chargement des patients…</div>:filtered.length===0?<div className="patient-empty"><PawPrint size={32}/><strong>{patients.length?"Aucun résultat":"Aucun patient enregistré"}</strong><span>{patients.length?"Modifiez le filtre ou la recherche.":"Ajoutez votre premier animal pour commencer."}</span></div>:<div className="patient-list">{filtered.map(p=><article className={"patient-row"+(p.is_alive===false?" patient-row-deceased":"")} key={p.id}><div className="patient-symbol">{photos[p.id]?<img src={photos[p.id]} alt={"Photo de "+p.name} className="patient-avatar"/>:<PawPrint size={22}/>}</div><div className="patient-identity"><strong>{p.name}</strong><span>{p.species} · {p.breed||"Race non renseignée"}</span><span>{ageOf(p.birth_date)}</span></div><div className="patient-owner"><small>Propriétaire</small><span>{p.owner_name||"Non renseigné"}</span></div><div className={"patient-status "+(p.is_alive===false?"patient-status-deceased":"patient-status-alive")}>{p.is_alive===false?<span>Décédé</span>:<><svg className="patient-ecg" viewBox="0 0 220 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,16 65,16 76,12 84,19 95,19 103,2 112,30 121,16 220,16" /></svg><span>En vie</span></>}</div><div className="patient-actions"><button title="Modifier" aria-label={"Modifier "+p.name} onClick={()=>open(p)}><Pencil size={17}/></button><button title="Archiver" aria-label={"Archiver "+p.name} disabled={busy} onClick={()=>void archive(p)}><Archive size={17}/></button></div></article>)}</div>}
    <p className="patient-count">{filtered.length} patient{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</p>
    {form&&<div className="patient-modal-backdrop" onPaste={onPaste} onClick={()=>{if(!busy)setForm(null);}}><div className="patient-modal" role="dialog" aria-modal="true" aria-label={editing?"Modifier un patient":"Ajouter un patient"} onClick={e=>e.stopPropagation()}><div className="patient-modal-header"><h2>{editing?"Modifier la fiche":"Nouveau patient"}</h2><button onClick={()=>setForm(null)} disabled={busy} aria-label="Fermer"><X size={20}/></button></div><form onSubmit={e=>void save(e)}>
      <div className="patient-photo-drop" tabIndex={0} onPaste={onPaste}>
        {photoPreview?<img src={photoPreview} alt="Aperçu de la photo" className="patient-photo-preview"/>:editing&&photos[editing.id]?<img src={photos[editing.id]} alt="Photo actuelle" className="patient-photo-preview"/>:<ImagePlus size={30}/>}
        <div><strong>Photo de l'animal</strong><p>Faites une capture d'écran, puis cliquez ici et appuyez sur Ctrl + V (ou Cmd + V). Vous pouvez aussi choisir un fichier.</p>
          <label className="patient-file-label">Choisir une image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)setImage(file);}}/></label>
        </div>
      </div>
      <div className="patient-form-grid">{field("Nom de l’animal","name",true)}<label className="patient-field"><span>Espèce *</span><select required value={form.species} onChange={e=>update("species",e.target.value)}><option value="">Choisir une espèce</option>{["Chien","Chat","NAC","Autre"].map(v=><option key={v}>{v}</option>)}{form.species&&!["Chien","Chat","NAC","Autre"].includes(form.species)&&<option>{form.species}</option>}</select></label>{field("Race","breed")}<div className="patient-birth-field"><div className={unknownAge?"patient-date-disabled":""}>{field("Date de naissance","birth_date",false,"date")}</div><label className="patient-unknown-age"><input type="checkbox" checked={unknownAge} onChange={e=>{setUnknownAge(e.target.checked);if(e.target.checked)update("birth_date","");}}/> Âge inconnu</label></div><label className="patient-field"><span>Sexe</span><select value={form.sex} onChange={e=>update("sex",e.target.value)}><option value="">Non renseigné</option><option value="Mâle">Mâle</option><option value="Femelle">Femelle</option><option value="Inconnu">Inconnu</option></select></label>{field("Nom du propriétaire","owner_name")}{field("Téléphone / contact","owner_contact")}<label className="patient-field"><span>Statut vital</span><select value={form.is_alive?"alive":"deceased"} onChange={e=>setForm(v=>v?{...v,is_alive:e.target.value==="alive"}:v)}><option value="alive">En vie</option><option value="deceased">Décédé</option></select></label></div><div className="patient-modal-footer"><button type="button" onClick={()=>setForm(null)} disabled={busy}>Annuler</button><button className="patient-primary" type="submit" disabled={busy}><Save size={17}/>{busy?"Enregistrement…":"Enregistrer"}</button></div></form></div></div>}
  </section>;
}