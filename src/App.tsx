import { useState } from "react";
import { PawPrint, LayoutDashboard, Users, CalendarDays, ClipboardList, BedDouble, Pill, FlaskConical, Receipt, Package, ChartColumn, Settings, ShieldAlert } from "lucide-react";

const sections = [
  { name: "Tableau de bord", icon: LayoutDashboard },
  { name: "Patients", icon: Users },
  { name: "Rendez-vous", icon: CalendarDays },
  { name: "Dossiers médicaux", icon: ClipboardList },
  { name: "Hospitalisations", icon: BedDouble },
  { name: "Traitements", icon: Pill },
  { name: "Analyses", icon: FlaskConical },
  { name: "Facturation", icon: Receipt },
  { name: "Pharmacie & stock", icon: Package },
  { name: "Statistiques", icon: ChartColumn },
  { name: "Paramètres", icon: Settings },
];

export default function App() {
  const [selected, setSelected] = useState("Tableau de bord");
  return <div className="layout">
    <aside className="sidebar"><div className="brand"><PawPrint size={29}/><div><strong>Vétérinaire</strong><small>Interface de soins</small></div></div>
      <nav>{sections.map(({name,icon:Icon})=><button key={name} className={selected===name?"active":""} onClick={()=>setSelected(name)}><Icon size={19}/>{name}</button>)}</nav>
      <div className="sidebar-foot">Panel vétérinaire · V.U.</div>
    </aside>
    <main><header><div><span className="eyebrow">ESPACE VÉTÉRINAIRE</span><h1>{selected}</h1><p>Gestion des soins et du suivi des animaux</p></div><div className="avatar"><PawPrint size={23}/></div></header>
      <div className="warning"><ShieldAlert size={21}/><div><strong>Interface de préparation — accès non activé</strong><p>La connexion sécurisée depuis EMS et le contrôle du rôle Discord V.U. doivent être déployés avant utilisation réelle. Aucune donnée médicale n’est chargée.</p></div></div>
      <div className="cards"><article><span>Patients</span><strong>—</strong><small>En attente de connexion</small></article><article><span>Rendez-vous</span><strong>—</strong><small>En attente de connexion</small></article><article><span>Hospitalisations</span><strong>—</strong><small>En attente de connexion</small></article></div>
      <section className="panel"><h2>{selected}</h2><p>Module prêt à être connecté aux données vétérinaires protégées de Supabase.</p><div className="empty"><PawPrint size={36}/><p>Les fonctionnalités seront activées après la mise en place de la passerelle sécurisée EMS → Vétérinaire.</p></div></section>
    </main>
  </div>;
}
