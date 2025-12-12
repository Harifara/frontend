import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi } from "@/lib/api";

// Icons
import {
  Users,
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
} from "recharts";

// ======================================================
//   DASHBOARD PROFESSIONNEL
// ======================================================
export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";

  // KPI
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

  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);
  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);

  // ======================================================
  //   CHARGEMENT DES DONNÉES
  // ======================================================
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // EMPLOYÉS
      const employees = await rhApi.getEmployes();
      const emp = employees.results || employees;
      setEmployeesCount(emp.length);

      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(emp.length * 0.80) },
        { name: "Feb", employees: Math.round(emp.length * 0.85) },
        { name: "Mar", employees: Math.round(emp.length * 0.90) },
        { name: "Apr", employees: Math.round(emp.length * 0.95) },
        { name: "May", employees: emp.length },
      ]);

      // AFFECTATIONS
      const affect = await rhApi.getAffectations();
      const aff = affect.results || affect;
      setAffectationsCount(aff.length);
      setRecentAffectations(aff.slice(0, 5));

      // CONGÉS
      const cong = await rhApi.getConges();
      const co = cong.results || cong;
      setCongesCount(co.length);
      setPendingCongesCount(co.filter((c: any) => c.status === "en_attente").length);
      setRecentConges(co.slice(0, 5));

      // CONTRATS
      const contrats = await rhApi.getContrats();
      const cn = contrats.results || contrats;
      setContratsCount(cn.length);

      // DISTRICTS
      const districts = await rhApi.getDistricts();
      setDistrictsCount((districts.results || districts).length);

      // COMMUNES
      const communes = await rhApi.getCommunes();
      setCommunesCount((communes.results || communes).length);

      // FOKONTANY
      const foko = await rhApi.getFokontany();
      setFokontanyCount((foko.results || foko).length);

      // LOCATIONS
      const loc = await rhApi.getLocations();
      setLocationsCount((loc.results || loc).length);

      // PAYEMENTS
      const pay = await rhApi.getPaiements();
      setPaymentsCount((pay.results || pay).length);

      // ACHATS
      const achats = await rhApi.getAchats();
      setAchatsCount((achats.results || achats).length);

      // DEMANDES
      const demandes = await rhApi.getDemandes();
      setDemandesCount((demandes.results || demandes).length);

    } catch (error) {
      console.error("Erreur Dashboard :", error);
    }
  };

  // ======================================================
  //   UI
  // ======================================================
  const KPICard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
      <div className="flex items-center">
        <Icon className={`w-8 h-8 mr-3 ${color}`} />
        <div>
          <p className="text-xl font-semibold">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Bonjour, {user?.full_name || user?.username}
      </h1>

      {/* ======================================================
          KPI
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <KPICard icon={Users} label="Employés" value={employeesCount} color="text-green-700" />
        <KPICard icon={Map} label="Districts" value={districtsCount} color="text-blue-600" />
        <KPICard icon={MapPin} label="Communes" value={communesCount} color="text-purple-600" />
        <KPICard icon={Home} label="Fokontany" value={fokontanyCount} color="text-orange-600" />

        <KPICard icon={ListChecks} label="Affectations" value={affectationsCount} color="text-indigo-600" />
        <KPICard icon={ClipboardList} label="Congés en attente" value={pendingCongesCount} color="text-red-600" />
        <KPICard icon={FileText} label="Contrats" value={contratsCount} color="text-cyan-600" />

        <KPICard icon={Building} label="Locations" value={locationsCount} color="text-yellow-600" />
        <KPICard icon={CreditCard} label="Paiements" value={paymentsCount} color="text-lime-600" />
        <KPICard icon={ShoppingCart} label="Achats" value={achatsCount} color="text-sky-600" />
        <KPICard icon={ClipboardList} label="Demandes" value={demandesCount} color="text-rose-600" />

      </div>

      {/* ======================================================
          GRAPHIQUE
      ====================================================== */}
      {(isAdmin || isRH) && (
        <Card className="p-4 bg-white shadow rounded-2xl border mb-8">
          <h2 className="text-lg font-semibold mb-4">Évolution des employés</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={employeeEvolution}>
              <XAxis dataKey="name" stroke="#4B5563" />
              <YAxis stroke="#4B5563" />
              <Tooltip />
              <Line type="monotone" dataKey="employees" stroke="#297373" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ======================================================
          TABLEAUX
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AFFECTATIONS */}
        <Card className="p-4 bg-white shadow rounded-2xl border">
          <h3 className="text-md font-semibold mb-3">Dernières affectations</h3>
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
                <tr key={idx} className="border-b">
                  <td className="py-2">{item?.employer?.full_name}</td>
                  <td>{item?.magasin?.nom}</td>
                  <td>{item?.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* CONGÉS */}
        <Card className="p-4 bg-white shadow rounded-2xl border">
          <h3 className="text-md font-semibold mb-3">Congés récents</h3>
          <ul className="text-sm space-y-1">
            {recentConges.map((c: any, idx) => (
              <li key={idx}>
                {c?.employer?.full_name} — {c?.nb_jours} jours
              </li>
            ))}
          </ul>
        </Card>

      </div>

    </div>
  );
}
