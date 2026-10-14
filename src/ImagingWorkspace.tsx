import {useEffect,useState} from "react";
import MedicalImaging from "./MedicalImaging";
type Patient={id:string;name:string;species:string;owner_name:string|null};
type Entry={id:string;patient_id:string;category:string;title:string;details:string;image_path?:string|null};
const base="https://pvahrnrtivzbkipborcd.supabase.co/functions/v1/";
const token=()=>{try{return JSON.parse(localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token")||"{}").access_token||""}catch{return ""}};
async function fetchData(path:string){const r=await fetch(base+path,{headers:{Authorization:"Bearer "+token()}});const d=await r.json();if(!r.ok)throw Error(d.error||"Chargement impossible");return d}
export default function ImagingWorkspace(){
 const [patients,setPatients]=useState<Patient[]>([]),[entries,setEntries]=useState<Entry[]>([]),[selected,setSelected]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);try{const [p,e]=await Promise.all([fetchData("veterinary-patients"),fetchData("veterinary-clinical")]);const ps:Patient[]=p.patients||[];setPatients(ps);setEntries(e.entries||[]);setSelected(v=>v||ps[0]?.id||"");setError("")}catch(e){setError(e instanceof Error?e.message:"Erreur de chargement")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 return <section className="patient-module"><h2>Imagerie</h2><p className="medical-help">Préparez votre examen puis choisissez l'animal dans lequel enregistrer les photographies cliniques. Les images enregistrées sont également consultables dans le dossier médical correspondant.</p>{error&&<p className="patient-error">{error}</p>}{loading?<p>Chargement…</p>:<><label className="patient-field"><span>Dossier médical de destination</span><select value={selected} onChange={e=>setSelected(e.target.value)}>{patients.map(p=><option key={p.id} value={p.id}>{p.name} · {p.species} · {p.owner_name||"Propriétaire non renseigné"}</option>)}</select></label>{selected&&<MedicalImaging key={selected} patientId={selected} entries={entries.filter(e=>e.patient_id===selected&&e.category==="imageries")} onSaved={load}/>}</>}</section>;
}
