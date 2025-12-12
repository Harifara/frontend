import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi } from "@/lib/api";

// Icons
import {
  Users, // Effectif
  ArrowRightCircle, // Démissions (simulées)
  User, // Hommes/Femmes
  Clock, // Âge Moyen
  ClipboardList,
  Map,
  MapPin,
  Home,
  Building,
  FileText,
  ShoppingCart,
  CreditCard,
  ListChecks,
} from "lucide-react";

// UI Components (Assurez-vous que le composant Card est disponible)
import { Card } from "@/components/ui/card";

// Charts (Ajout de PieChart, BarChart pour la complétude du style Excel)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// ======================================================
//   TYPAGES
// ======================================================

interface EmployeeEvolutionData {
  name: string;
  employees: number;
}

interface GenericStat {
    name: string;
    value: number;
}

// Couleurs principales inspirées de l'image Excel (Orange/Gris)
const PRIMARY_COLOR = "#f48c06"; // Orange terreux
const SECONDARY_TEXT_COLOR = "#333333"; // Gris foncé pour le texte
const CHART_COLORS = ["#f48c06", "#ffb347", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];


// ======================================================
//   NOUVEAU COMPOSANT KPI STYLE EXCEL
// ======================================================
const KPICardExcel: React.FC<{ icon: React.ElementType; label: string; value: string | number; color?: string }> = ({
  icon: Icon,
  label,
  value,
  color = PRIMARY_COLOR,
}) => (
  <Card className="flex flex-col items-center justify-center p-4 bg-gray-200 border-2 border-gray-300 rounded-lg shadow-md transition duration-200 h-full">
    <p className="text-sm font-bold uppercase text-gray-700 mb-2 text-center">{label}</p>
    <div className="flex flex-col items-center">
      <Icon className="w-8 h-8" style={{ color: color }} />
      <p className="text-3xl font-extrabold mt-2" style={{ color: color }}>
        {value}
      </p>
    </div>
  </Card>
);


// ======================================================
//   DASHBOARD PROFESSIONNEL (TSX ADAPTÉ)
// ======================================================
export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";

  // KPI STATES
  const [employeesCount, setEmployeesCount] = useState(0);
  const [affectationsCount, setAffectationsCount] = useState(0);
  const [congesCount, setCongesCount] = useState(0);
  const [pendingCongesCount, setPendingCongesCount] = useState(0);
  const [contratsCount, setContratsCount] = useState(0);
  const [districtsCount, setDistrictsCount] = useState(0);
  const [communesCount, setCommunesCount] = useState(0);
  const [fokontanyCount, setFokontanyCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [achatsCount, setAchatsCount] = useState(0);
  const [demandesCount, setDemandesCount] = useState(0);
  
  // NOUVEAUX STATES pour les KPI spécifiques à l'image
  const [femalePercentage, setFemalePercentage] = useState(0);
  const [malePercentage, setMalePercentage] = useState(0);
  const [avgAge, setAvgAge] = useState(0);
  const [resignationsCount, setResignationsCount] = useState(0);


  // GRAPH & LIST STATES
  const [employeeEvolution, setEmployeeEvolution] = useState<EmployeeEvolutionData[]>([]);
  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<GenericStat[]>([]); // Pour le graphique "Tranche d'Âges"
  const [seniorityDistribution, setSeniorityDistribution] = useState<GenericStat[]>([]); // Pour le graphique "Ancienneté"


  // ======================================================
  //   LOGIQUE DE CALCUL (pour les KPI de l'image)
  // ======================================================
  const calculateDerivedStats = (emp: any[]) => {
    const totalEmp = emp.length || 1;
    const femmesCount = emp.filter((e: any) => e.gender === "F").length;
    const hommesCount = emp.filter((e: any) => e.gender === "M").length;

    setFemalePercentage(Math.round((femmesCount / totalEmp) * 100));
    setMalePercentage(Math.round((hommesCount / totalEmp) * 100));
    setResignationsCount(Math.floor(emp.length * 0.1)); // Simulation des démissions

    // Simulation de la distribution par âge
    setAgeDistribution([
      { name: "18-25", value: Math.floor(totalEmp * 0.15) },
      { name: "26-35", value: Math.floor(totalEmp * 0.45) },
      { name: "36-45", value: Math.floor(totalEmp * 0.25) },
      { name: "46+", value: Math.floor(totalEmp * 0.15) },
    ]);
    
    // Simulation de la distribution par ancienneté
    setSeniorityDistribution([
        { name: "< 1 an", value: Math.floor(totalEmp * 0.25) },
        { name: "1-3 ans", value: Math.floor(totalEmp * 0.40) },
        { name: "4-7 ans", value: Math.floor(totalEmp * 0.20) },
        { name: "8+ ans", value: Math.floor(totalEmp * 0.15) },
      ]);


    // Calcul de l'âge moyen (nécessite 'date_naissance' dans le modèle d'employé)
    let totalAge = 0;
    const now = new Date();
    emp.forEach((e: any) => {
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
    setAvgAge(Math.round(totalAge / totalEmp));
  };


  // ======================================================
  //   CHARGEMENT DES DONNÉES
  // ======================================================
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // ... (Tous les appels API en série comme dans le code original) ...
      const employees = await rhApi.getEmployes();
      const emp = employees.results || employees;
      setEmployeesCount(emp.length);

      setEmployeeEvolution([
        { name: "2021", employees: Math.round(emp.length * 0.70) },
        { name: "2022", employees: Math.round(emp.length * 0.85) },
        { name: "2023", employees: Math.round(emp.length * 0.95) },
        { name: "2024", employees: emp.length },
      ]);
      
      calculateDerivedStats(emp); // Calcul des KPI dérivés

      const affect = await rhApi.getAffectations();
      const aff = affect.results || affect;
      setAffectationsCount(aff.length);
      setRecentAffectations(aff.slice(0, 5));

      const cong = await rhApi.getConges();
      const co = cong.results || cong;
      setCongesCount(co.length);
      setPendingCongesCount(co.filter((c: any) => c.status === "en_attente").length);
      setRecentConges(co.slice(0, 5));
      
      // ... (Reste des appels API pour les autres counts) ...
      const contrats = await rhApi.getContrats();
      setContratsCount((contrats.results || contrats).length);
      const districts = await rhApi.getDistricts();
      setDistrictsCount((districts.results || districts).length);
      const communes = await rhApi.getCommunes();
      setCommunesCount((communes.results || communes).length);
      const foko = await rhApi.getFokontany();
      setFokontanyCount((foko.results || foko).length);
      const loc = await rhApi.getLocations();
      setLocationsCount((loc.results || loc).length);
      const pay = await rhApi.getPaiements();
      setPaymentsCount((pay.results || pay).length);
      const achats = await rhApi.getAchats();
      setAchatsCount((achats.results || achats).length);
      const demandes = await rhApi.getDemandes();
      setDemandesCount((demandes.results || demandes).length);

    } catch (error) {
      console.error("Erreur Dashboard :", error);
    }
  };
  
  // Composant pour les cartes de graphiques/listes
  const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
    <Card className={`p-4 bg-white shadow rounded-lg border h-full ${className}`}>
      <h3 className="text-md font-semibold mb-4 text-center uppercase" style={{ color: SECONDARY_TEXT_COLOR }}>
        {title}
      </h3>
      {children}
    </Card>
  );

  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de Bord Ressources Humaines
      </h1>

      {/* ======================= KPI GRID - RANGÉE SUPÉRIEURE (Style Excel) ======================= */}
      {/* 5 KPIs principaux de l'image (Effectif, Démissions, Femmes, Hommes, Âge Moyen) */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KPICardExcel icon={Users} label="Effectif" value={employeesCount} />
        <KPICardExcel icon={ArrowRightCircle} label="Démissions" value={resignationsCount} />
        <KPICardExcel icon={User} label="Femmes" value={`${femalePercentage}%`} />
        <KPICardExcel icon={User} label="Hommes" value={`${malePercentage}%`} />
        <KPICardExcel icon={Clock} label="Âge Moyen" value={avgAge} />
      </div>

      {/* ======================= GRAPHIQUES - RANGÉE CENTRALE (Style Excel) ======================= */}
      {(isAdmin || isRH) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* 1. Effectif (Graphique en ligne) */}
          <ChartCard title="Effectif">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={employeeEvolution}>
                <XAxis dataKey="name" stroke={SECONDARY_TEXT_COLOR} />
                <YAxis stroke={SECONDARY_TEXT_COLOR} />
                <Tooltip />
                <Line type="monotone" dataKey="employees" stroke={PRIMARY_COLOR} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Tranche d'Âges (Histogramme/BarChart) */}
          <ChartCard title="Tranche d'Âges">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageDistribution}>
                <XAxis dataKey="name" stroke={SECONDARY_TEXT_COLOR} />
                <YAxis stroke={SECONDARY_TEXT_COLOR} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR}>
                    {ageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. Ancienneté (Histogramme/BarChart) */}
          <ChartCard title="Ancienneté">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={seniorityDistribution}>
                <XAxis dataKey="name" stroke={SECONDARY_TEXT_COLOR} />
                <YAxis stroke={SECONDARY_TEXT_COLOR} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR}>
                    {seniorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ======================= LISTES / PALMARÈS / TABLES ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLONNE 1: Affectations récentes + Congés récents */}
        <div className="space-y-6">
            <ChartCard title="Dernières affectations" className="col-span-1">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2 text-left">Employé</th>
                            <th className="text-left">Magasin</th>
                            <th className="text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentAffectations.map((item: any, idx) => (
                            <tr key={idx} className="border-b text-gray-700">
                                <td className="py-2">{item?.employer?.full_name}</td>
                                <td>{item?.magasin?.nom}</td>
                                <td>{item?.created_at?.slice(0, 10)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ChartCard>

            <ChartCard title="Congés récents" className="col-span-1">
                <ul className="text-sm space-y-2 text-gray-700">
                    {recentConges.map((c: any, idx) => (
                        <li key={idx} className="border-b pb-1">
                            **{c?.employer?.full_name}** — {c?.nb_jours} jours ({c?.status})
                        </li>
                    ))}
                </ul>
            </ChartCard>
        </div>
        
        {/* COLONNE 2: Palmarès (Simulation) */}
        <div className="space-y-6">
            <ChartCard title="TOP 5 PLUS HAUT SALAIRE">
                <ul className="text-sm space-y-1">
                    <li className="flex justify-between border-b py-1 text-green-700 font-bold"><span>AGENT 1</span><span>90 000,00</span></li>
                    <li className="flex justify-between border-b py-1 text-green-700 font-bold"><span>AGENT 2</span><span>75 000,00</span></li>
                    <li className="flex justify-between border-b py-1"><span>AGENT 3</span><span>60 000,00</span></li>
                    <li className="flex justify-between border-b py-1"><span>AGENT 4</span><span>55 000,00</span></li>
                    <li className="flex justify-between py-1"><span>AGENT 5</span><span>50 000,00</span></li>
                </ul>
            </ChartCard>

            <ChartCard title="TOP 5 PLUS BAS SALAIRE">
                <ul className="text-sm space-y-1">
                    <li className="flex justify-between border-b py-1 text-red-700 font-bold"><span>AGENT X</span><span>10 500,00</span></li>
                    <li className="flex justify-between border-b py-1 text-red-700 font-bold"><span>AGENT Y</span><span>11 500,00</span></li>
                    <li className="flex justify-between border-b py-1"><span>AGENT Z</span><span>12 500,00</span></li>
                    <li className="flex justify-between border-b py-1"><span>AGENT A</span><span>13 500,00</span></li>
                    <li className="flex justify-between py-1"><span>AGENT B</span><span>14 500,00</span></li>
                </ul>
            </ChartCard>
        </div>

        {/* COLONNE 3: Filtres (Simulés comme Slicers) + KPI Secondaires */}
        <div className="space-y-6">
             <Card className="p-4 bg-gray-300 shadow rounded-lg border">
                <h3 className="text-md font-bold mb-3 uppercase text-center">Filtres et Connexions</h3>
                <p className="text-sm font-semibold mb-1">Date d'embauche (Slicer):</p>
                <div className="grid grid-cols-3 text-xs gap-1 mb-3">
                    {/* Simulation de boutons de Slicer actifs/inactifs */}
                    <span className="bg-white p-1 rounded border border-gray-400 text-center cursor-pointer">2023</span>
                    <span className="bg-gray-500 text-white p-1 rounded border border-gray-400 text-center cursor-pointer">2024</span>
                    <span className="bg-white p-1 rounded border border-gray-400 text-center cursor-pointer">2025</span>
                </div>
                <p className="text-sm font-semibold mb-1">Direction / Poste / Sexe (Slicers):</p>
                <div className="text-xs space-y-1">
                    <div className="bg-white p-1 rounded border border-gray-400">Direction Générale</div>
                    <div className="bg-white p-1 rounded border border-gray-400">Agent de Terrain</div>
                    <div className="bg-white p-1 rounded border border-gray-400">Femme</div>
                </div>
            </Card>

            {/* Reprise des KPI secondaires pour remplir la colonne */}
            <KPICardExcel icon={Building} label="Locations" value={locationsCount} color="#65a30d" />
            <KPICardExcel icon={CreditCard} label="Paiements" value={paymentsCount} color="#84cc16" />
        </div>
      </div>
    </div>
  );
}