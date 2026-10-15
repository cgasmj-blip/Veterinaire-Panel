import { useEffect, useState } from "react";
import Patients from "./Patients";
import Appointments from "./Appointments";
import MedicalRecords from "./MedicalRecords";
import VeterinaryDashboard from "./VeterinaryDashboard";
import TraumaWorkspace from "./TraumaWorkspace";
import {Billing,TariffSettings} from "./VetBillingTrauma";
import { PawPrint, LayoutDashboard, Users, CalendarDays, ClipboardList, BedDouble, Receipt, Package, ChartColumn, Settings, ShieldAlert } from "lucide-react";

const sections = [
  { name: "Tableau de bord", icon: LayoutDashboard },
  { name: "Patients", icon: Users },
  { name: "Rendez-vous", icon: CalendarDays },
  { name: "Dossiers médicaux", icon: ClipboardList },
  { name: "Traumatologie", icon: ShieldAlert },
  { name: "Hospitalisations", icon: BedDouble },
  { name: "Facturation", icon: Receipt },
  { name: "Pharmacie & stock", icon: Package },
  { name: "Statistiques", icon: ChartColumn },
  { name: "Paramètres", icon: Settings },
];

const accessKey = "veterinary-panel-verified";
const pageKey = "veterinary-panel-page";
function hasRecentAccess() {
  try {
    const token = JSON.parse(localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token") || "null")?.access_token;
    return typeof token === "string" && !!token && sessionStorage.getItem(accessKey) === "yes";
  } catch { return false; }
}
export default function App() {
  const [selected, setSelected] = useState(() => { const saved = sessionStorage.getItem(pageKey); return sections.some(s => s.name === saved) ? saved! : "Tableau de bord"; });
  const [access, setAccess] = useState<"checking" | "granted" | "denied">(() => hasRecentAccess() ? "granted" : "checking");
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const ticket = params.get("ticket");
    if (ticket) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    let active = true;
    const endpoint = "https://pvahrnrtivzbkipborcd.supabase.co/functions/v1/";
    const checkAccess = async () => {
      try {
        if (ticket) {
          const response = await fetch(endpoint + "veterinary-consume", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket }),
          });
          if (!response.ok) throw Error("Accès EMS refusé");
        } else {
          // On refresh, revalidate the existing Supabase session server-side.
          // Never grant access solely from a browser storage flag.
          const stored = localStorage.getItem("sb-pvahrnrtivzbkipborcd-auth-token");
          const token: unknown = stored ? JSON.parse(stored)?.access_token : null;
          if (typeof token !== "string" || !token) throw Error("Session absente");
          const response = await fetch(endpoint + "veterinary-patients", {
            headers: { Authorization: "Bearer " + token },
          });
          if (!response.ok) throw Error("Session expirée ou accès refusé");
        }
        if (active) { sessionStorage.setItem(accessKey, "yes"); setAccess("granted"); }
      } catch {
        if (active) { sessionStorage.removeItem(accessKey); setAccess("denied"); }
      }
    };
    void checkAccess();
    return () => { active = false; };
  }, []);
  if (access !== "granted") return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f5faef",color:"#365c38",fontFamily:"system-ui"}}>
    <div style={{textAlign:"center",maxWidth:440,padding:28}}>
      <PawPrint size={44} />
      <h1>{access === "checking" ? "Vérification de l’accès…" : "403 — Accès refusé"}</h1>
      <p>{access === "checking" ? "Validation de votre entrée depuis EMS." : "Ouvrez le panel depuis le bouton patte de chien de votre interface EMS, avec le grade V.U."}</p>
      <a href="https://cgasmj-blip.github.io/EMS-Panel/#/dashboard" style={{color:"#365c38",fontWeight:700}}>Retour EMS</a>
    </div>
  </div>;
  return <div className="layout">
    <aside className="sidebar"><div className="brand"><PawPrint size={29}/><div><strong>Vétérinaire</strong><small>Interface de soins</small></div></div>
      <nav>{sections.map(({name,icon:Icon})=><button key={name} className={selected===name?"active":""} onClick={()=>{sessionStorage.setItem(pageKey,name);setSelected(name);}}><Icon size={19}/>{name}</button>)}</nav>
      <div className="sidebar-foot"><a href="https://cgasmj-blip.github.io/EMS-Panel/#/dashboard">← Retour EMS</a><br/>Panel vétérinaire · V.U.</div>
    </aside>
    <main><header><div><span className="eyebrow">ESPACE VÉTÉRINAIRE</span><h1>{selected}</h1><p>Gestion des soins et du suivi des animaux</p></div><div className="avatar"><PawPrint size={23}/></div></header>
      {!["Tableau de bord","Patients","Rendez-vous","Dossiers médicaux","Traumatologie","Facturation","Paramètres"].includes(selected) && <div className="warning"><ShieldAlert size={21}/><div><strong>Interface de préparation — accès non activé</strong><p>La connexion sécurisée depuis EMS et le contrôle du rôle Discord V.U. doivent être déployés avant utilisation réelle. Aucune donnée médicale n’est chargée.</p></div></div>}
      {!["Patients","Rendez-vous","Dossiers médicaux"].includes(selected) && <div className="cards"><article><span>Patients</span><strong>—</strong><small>En attente de connexion</small></article><article><span>Rendez-vous</span><strong>—</strong><small>En attente de connexion</small></article><article><span>Hospitalisations</span><strong>—</strong><small>En attente de connexion</small></article></div>}
      {selected === "Tableau de bord" ? <VeterinaryDashboard /> : selected === "Patients" ? <Patients /> : selected === "Rendez-vous" ? <Appointments /> : selected === "Dossiers médicaux" ? <MedicalRecords /> : selected === "Traumatologie" ? <TraumaWorkspace /> : selected === "Facturation" ? <Billing /> : selected === "Paramètres" ? <TariffSettings /> : <section className="panel"><h2>{selected}</h2><p>Module prêt à être connecté aux données vétérinaires protégées de Supabase.</p><div className="empty"><PawPrint size={36}/><p>Les fonctionnalités seront activées après la mise en place de la passerelle sécurisée EMS → Vétérinaire.</p></div></section>}
    </main>
  </div>;
}
