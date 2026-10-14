import {useEffect,useState} from "react";
import TraumaAssistant from "./TraumaAssistant";
type Patient={id:string;name:string;owner_name:string|null;species:string};
const url="https://pvahrnrtivzbkipborcd.supabase.co/functions/v1/veterinary-patients";
export default function TraumaWorkspace(){
 const [patients,setPatients]=useState<Patient[]>([]),[id,setId]=useState(""),[error,setError]=useState("");
 useEffect(()=>{let token="";try{token=JSON.parse(localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token")||"{}").access_token||""}catch{}fetch(url,{headers:{Authorization:"Bearer "+token}}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Impossible de charger les patients");return d}).then(d=>{const ps:Patient[]=d.patients||[];setPatients(ps);setId(ps[0]?.id||"")}).catch(e=>setError(e instanceof Error?e.message:"Erreur"))},[]);
 const patient=patients.find(p=>p.id===id);
 return <section className="patient-module"><h2>Assistant traumatologique</h2><p className="medical-help">Préparez l'évaluation et les pistes d'examens avant la consultation. Les actes réalisés, prescriptions, résultats et factures se saisissent ensuite dans leurs modules respectifs.</p>{error&&<p className="patient-error">{error}</p>}<label className="patient-field"><span>Animal concerné</span><select value={id} onChange={e=>setId(e.target.value)}>{patients.map(p=><option key={p.id} value={p.id}>{p.name} · {p.species}</option>)}</select></label>{patient&&<TraumaAssistant key={patient.id} patientId={patient.id} patientName={patient.name} ownerName={patient.owner_name}/>}</section>;
}
