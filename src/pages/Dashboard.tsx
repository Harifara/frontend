import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi } from "@/lib/api";

// Icons (mis à jour pour correspondre aux KPIs de l'image RH)
import {
  Users, // Effectif
  ArrowRightCircle, // Démissions (ou départs)
  User, // Hommes/Femmes
  Clock, // Âge Moyen
  Briefcase, // Contrats
  MapPin, // Affectations
  ClipboardList, // Congés
  ListChecks, // Demandes
} from "lucide-react";

// UI Components
import { Card } from "@/components/ui/card";

// Charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// ======================================================
//   COULEURS INSPIRÉES DU DASHBOARD EXCEL (Orange/Gris)
// ======================================================
const PRIMARY_COLOR = "#f48c06"; // Orange terreux pour les barres/lignes
const SECONDARY_COLOR = "#333333"; // Gris foncé pour le texte/fond

// ======================================================
//   NOUVEAU COMPOSANT KPI STYLE EXCEL
// ======================================================
// Note : Le style des KPI dans l'image est très spécifique (fond gris, icône/valeur orange).
const KPICardExcel = ({ icon: Icon, label, value, color = PRIMARY_COLOR }: any) => (
  <Card className="flex flex-col items-center justify-center p-4 bg-gray-200 border-2 border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-200">
    {/* Étiquette / Titre du KPI (en haut, en gras comme dans l'image) */}
    <p className="text-sm font-bold uppercase text-gray-700 mb-2">{label}</p>
    <div className="flex flex-col items-center">
      {/* Icône et Valeur (Couleur Orange) */}
      <Icon className="w-8 h-8" style={{ color: color }} />
      <p className="text-3xl font-extrabold mt-2" style={{ color: color }}>
        {value}
      </p>
    </div>
  </Card>
);

// ======================================================
//   DASHBOARD RH (ADAPTÉ AU STYLE DE L'IMAGE)
// ======================================================
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";

  // ... (Logique de chargement des données et états inchangés) ...
  const [stats, setStats] = useState({
    employees: 0,
    affectations: 0,
    conges: 0,
    pendingConges: 0,
    contrats: 0,
    districts: 0,
    communes: 0,
    fokontany: 0,
    locations: 0,
    payments: 0,
    achats: 0,
    demandes: 0,
  });

  const [recentAffectations, setRecentAffectations] = useState([]);
  const [recentConges, setRecentConges] = useState([]);
  const [employeeEvolution, setEmployeeEvolution] = useState([]);
  const [congesStats, setCongesStats] = useState([]);
  const [affectationsStats, setAffectationsStats] = useState([]);
  const [achatsStats, setAchatsStats] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [
        employees,
        affectations,
        conges,
        contrats,
        districts,
        // ... (autres API calls)
        communes,
        fokos,
        locations,
        payments,
        achats,
        demandes,
      ] = await Promise.all([
        rhApi.getEmployes(),
        rhApi.getAffectations(),
        rhApi.getConges(),
        rhApi.getContrats(),
        rhApi.getDistricts(),
        rhApi.getCommunes(),
        rhApi.getFokontanys(),
        rhApi.getLocations(),
        rhApi.getPayements(),
        rhApi.getAchats(),
        rhApi.getDemandes(),
      ]);

      const emp = employees.results || employees;
      const aff = affectations.results || affectations;
      const co = conges.results || conges;

      // Logique pour déterminer la proportion Hommes/Femmes pour l'affichage de l'image
      const femmesCount = emp.filter((e: any) => e.gender === "F").length;
      const hommesCount = emp.filter((e: any) => e.gender === "M").length;
      const totalEmp = emp.length || 1; // Évite la division par zéro

      // Calculez l'âge moyen (nécessite l'implémentation de la date de naissance dans l'API/modèle)
      const calculateAverageAge = (data: any) => {
        if (data.length === 0) return 0;
        let totalAge = 0;
        const now = new Date();
        data.forEach((e: any) => {
          if (e.date_naissance) {
            const birthDate = new Date(e.date_naissance);
            let age = now.getFullYear() - birthDate.getFullYear();
            const m = now.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
              age--;
            }
            totalAge += age;
          }
        });
        return Math.round(totalAge / data.length);
      };

      setStats({
        employees: emp.length,
        affectations: aff.length,
        conges: co.length,
        pendingConges: co.filter((c: any) => c.status === "en_attente").length,
        contrats: (contrats.results || contrats).length,
        districts: (districts.results || districts).length,
        communes: (communes.results || communes).length,
        fokontany: (fokos.results || fokos).length,
        locations: (locations.results || locations).length,
        payments: (payments.results || payments).length,
        achats: (achats.results || achats).length,
        demandes: (demandes.results || demandes).length,
        // Nouveaux stats pour les KPI principaux de l'image
        femalePercentage: Math.round((femmesCount / totalEmp) * 100),
        malePercentage: Math.round((hommesCount / totalEmp) * 100),
        resignations: Math.floor(emp.length * 0.1), // Exemple, à remplacer par la vraie logique
        avgAge: calculateAverageAge(emp),
      });

      // ... (Logique des graphiques inchangée) ...
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(emp.length * 0.8) },
        { name: "Feb", employees: Math.round(emp.length * 0.88) },
        { name: "Mar", employees: Math.round(emp.length * 0.93) },
        { name: "Apr", employees: Math.round(emp.length * 0.97) },
        { name: "May", employees: emp.length },
      ]);

      setRecentAffectations(aff.slice(0, 5));
      setRecentConges(co.slice(0, 5));

      const congesByStatus: any = {};
      co.forEach((c: any) => {
        congesByStatus[c.status] = (congesByStatus[c.status] || 0) + 1;
      });
      setCongesStats(
        Object.keys(congesByStatus).map((key) => ({ name: key, value: congesByStatus[key] }))
      );

      const affByMagasin: any = {};
      aff.forEach((a: any) => {
        const name = a.magasin?.nom || "Inconnu";
        affByMagasin[name] = (affByMagasin[name] || 0) + 1;
      });
      setAffectationsStats(
        Object.keys(affByMagasin).map((key) => ({ magasin: key, affectations: affByMagasin[key] }))
      );

      const achatsByMonth: any = {};
      (achats.results || achats).forEach((a: any) => {
        const month = a.created_at?.slice(0, 7) || "Inconnu";
        achatsByMonth[month] = (achatsByMonth[month] || 0) + a.total;
      });
      setAchatsStats(
        Object.keys(achatsByMonth)
          .sort()
          .map((key) => ({ month: key, total: achatsByMonth[key] }))
      );
    } catch (error) {
      console.error("Erreur Dashboard :", error);
    }
  };

  const ChartCard = ({ title, children }: any) => (
    <Card className="p-4 bg-white shadow rounded-lg border">
      <h2 className="text-md font-semibold mb-4 text-center uppercase" style={{ color: SECONDARY_COLOR }}>
        {title}
      </h2>
      {children}
    </Card>
  );

  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {/* Titre Principal comme dans l'image */}
        Tableau de Bord Ressources Humaines
      </h1>

      {/* ======================= KPI GRID - RANGÉE SUPÉRIEURE ======================= */}
      {/* 5 KPIs principaux de l'image */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KPICardExcel icon={Users} label="Effectif" value={stats.employees} />
        {/* L'icône des démissions peut être ArrowRightCircle ou une autre icône de départ si disponible */}
        <KPICardExcel icon={ArrowRightCircle} label="Démissions" value={stats.resignations} />
        {/* Note: Dans un vrai projet, il faudrait calculer ces pourcentages */}
        <KPICardExcel icon={User} label="Femmes" value={`${stats.femalePercentage}%`} />
        <KPICardExcel icon={User} label="Hommes" value={`${stats.malePercentage}%`} />
        {/* L'icône de l'âge moyen peut être Clock ou Users pour l'effectif */}
        <KPICardExcel icon={Clock} label="Âge Moyen" value={stats.avgAge} />
      </div>

      {/* ======================= GRAPHIQUES - RANGÉE CENTRALE ======================= */}
      {/* 3 Graphiques principaux de l'image: Effectif (Ligne), Tranches d'âge (Barres), Ancienneté (Barres) */}
      {(isAdmin || isRH) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* 1. Évolution des employés (Effectif - Ligne) */}
          <ChartCard title="Effectif">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={employeeEvolution}>
                <XAxis dataKey="name" stroke={SECONDARY_COLOR} />
                <YAxis stroke={SECONDARY_COLOR} />
                <Tooltip />
                {/* Ligne de la couleur principale */}
                <Line type="monotone" dataKey="employees" stroke={PRIMARY_COLOR} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Tranches d'Âges (BarChart fictif) */}
          <ChartCard title="Tranche d'Âges">
            <ResponsiveContainer width="100%" height={200}>
              {/* Utilisation de BarChart pour la Tranche d'âges */}
              <BarChart data={[
                { age: "18-25", count: 15 },
                { age: "26-35", count: 35 },
                { age: "36-45", count: 42 },
                { age: "46-55", count: 20 },
                { age: "55+", count: 8 },
              ]}>
                <XAxis dataKey="age" stroke={SECONDARY_COLOR} />
                <YAxis stroke={SECONDARY_COLOR} />
                <Tooltip />
                {/* Barres de la couleur principale */}
                <Bar dataKey="count" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. Ancienneté (BarChart fictif) */}
          <ChartCard title="Ancienneté">
            <ResponsiveContainer width="100%" height={200}>
              {/* Utilisation de BarChart pour l'Ancienneté */}
              <BarChart data={[
                { anciennete: "< 1 an", count: 30 },
                { anciennete: "1-3 ans", count: 50 },
                { anciennete: "4-7 ans", count: 25 },
                { anciennete: "8+ ans", count: 10 },
              ]}>
                <XAxis dataKey="anciennete" stroke={SECONDARY_COLOR} />
                <YAxis stroke={SECONDARY_COLOR} />
                <Tooltip />
                <Bar dataKey="count" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ======================= ÉLÉMENTS SECONDAIRES ET LISTES ======================= */}
      {/* Les éléments de l'image (Top Salaires, Postes, Filtres) nécessitent une structure de grille plus complexe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Colonne 1: Graphiques supplémentaires (Achats, Congés, Affectations) */}
        <div className="space-y-4">
          <ChartCard title="Achats Mensuels">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={achatsStats}>
                <XAxis dataKey="month" stroke={SECONDARY_COLOR} />
                <YAxis stroke={SECONDARY_COLOR} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke={PRIMARY_COLOR} fill={PRIMARY_COLOR} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          
          <ChartCard title="Répartition des congés">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={congesStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {congesStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Colonne 2: TOP 5 SALAIRES + POSTES (Liste statique pour l'exemple) */}
        <div className="space-y-4">
          <Card className="p-4 bg-white shadow rounded-lg border">
            <h3 className="text-md font-semibold mb-3 uppercase text-center" style={{ color: PRIMARY_COLOR }}>TOP 5 PLUS HAUT SALAIRE</h3>
            <ul className="text-sm space-y-1">
              <li className="flex justify-between border-b py-1"><span>AGENT 1</span><span className="font-bold">90 000,00</span></li>
              <li className="flex justify-between border-b py-1"><span>AGENT 2</span><span className="font-bold">75 000,00</span></li>
              <li className="flex justify-between border-b py-1"><span>AGENT 3</span><span className="font-bold">60 000,00</span></li>
            </ul>
          </Card>
          <Card className="p-4 bg-white shadow rounded-lg border">
            <h3 className="text-md font-semibold mb-3 uppercase text-center" style={{ color: PRIMARY_COLOR }}>TOP 5 PLUS BAS SALAIRE</h3>
            <ul className="text-sm space-y-1">
              <li className="flex justify-between border-b py-1"><span>AGENT X</span><span className="font-bold">10 500,00</span></li>
              <li className="flex justify-between border-b py-1"><span>AGENT Y</span><span className="font-bold">11 500,00</span></li>
              <li className="flex justify-between border-b py-1"><span>AGENT Z</span><span className="font-bold">12 500,00</span></li>
            </ul>
          </Card>
          <Card className="p-4 bg-white shadow rounded-lg border">
            <h3 className="text-md font-semibold mb-3 uppercase text-center" style={{ color: SECONDARY_COLOR }}>Poste</h3>
            <ul className="text-sm space-y-1">
              <li>Commercial (25)</li>
              <li>Comptable (10)</li>
              <li>Agent de Terrain (50)</li>
            </ul>
          </Card>
        </div>
        
        {/* Colonne 3: Panneau de Filtres (Slicers) + Affectations/Congés */}
        <div className="space-y-4">
          {/* Simulation des Filtres/Slicers (peut être remplacé par un composant Slicer réel) */}
          <Card className="p-4 bg-gray-300 shadow rounded-lg border">
            <h3 className="text-md font-bold mb-3 uppercase">Filtres</h3>
            <p className="text-sm font-semibold mb-1">Date d'embauche:</p>
            <div className="grid grid-cols-2 text-xs gap-1">
              <span className="bg-white p-1 rounded border border-gray-400">2023</span>
              <span className="bg-white p-1 rounded border border-gray-400">2024</span>
              <span className="bg-white p-1 rounded border border-gray-400">2025</span>
              {/* ... autres années/filtres ... */}
            </div>
            <p className="text-sm font-semibold mt-3 mb-1">Direction/Sexe/Poste:</p>
            {/* ... autres filtres ... */}
          </Card>

          {/* Tableau des Affectations récentes */}
          <Card className="p-4 bg-white shadow rounded-lg border">
            <h3 className="text-md font-semibold mb-3">Dernières affectations</h3>
            <table className="w-full text-sm">
              {/* ... (tableau d'affectations existant) ... */}
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Employé</th>
                  <th className="text-left">Magasin</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAffectations.map((item: any, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item?.employer?.full_name}</td>
                    <td>{item?.magasin?.nom}</td>
                    <td>{item?.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}