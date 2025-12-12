import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// APIs
import { rhApi } from "@/lib/api";
import { geoApi, stockApi, financeApi } from "@/lib/api-all";

// UI
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Icons
import {
  Users,
  Map,
  MapPin,
  Layers,
  ClipboardList,
  Briefcase,
  Home,
  CreditCard,
  ShoppingCart,
  FileCheck,
} from "lucide-react";

// Charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();

  /* ======================================================
      STATES
  ====================================================== */
  const [employeesCount, setEmployeesCount] = useState(0);
  const [congesCount, setCongesCount] = useState(0);
  const [affectationsCount, setAffectationsCount] = useState(0);
  const [contratsCount, setContratsCount] = useState(0);

  const [districtsCount, setDistrictsCount] = useState(0);
  const [communesCount, setCommunesCount] = useState(0);
  const [fokontanyCount, setFokontanyCount] = useState(0);

  const [locationsCount, setLocationsCount] = useState(0);
  const [paiementsCount, setPaiementsCount] = useState(0);
  const [achatsCount, setAchatsCount] = useState(0);
  const [demandesCount, setDemandesCount] = useState(0);

  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  /* ======================================================
      LOAD DATA
  ====================================================== */
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      /* ----------------------------
          RH DATA
      -----------------------------*/
      const employeesRes = await rhApi.getEmployes();
      const employees = employeesRes?.results || employeesRes || [];
      setEmployeesCount(employees.length);

      const congesRes = await rhApi.getConges();
      const conges = congesRes?.results || congesRes || [];
      setCongesCount(conges.length);

      const affectRes = await rhApi.getAffectations();
      setAffectationsCount(affectRes?.count || affectRes.length);

      const contratRes = await rhApi.getContrats();
      setContratsCount(contratRes?.count || contratRes.length);

      /* Graph employé */
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(employees.length * 0.8) },
        { name: "Feb", employees: Math.round(employees.length * 0.85) },
        { name: "Mar", employees: Math.round(employees.length * 0.9) },
        { name: "Apr", employees: Math.round(employees.length * 0.95) },
        { name: "May", employees: employees.length },
      ]);

      /* ----------------------------
          GEO DATA
      -----------------------------*/
      setDistrictsCount((await geoApi.getDistricts())?.count || 0);
      setCommunesCount((await geoApi.getCommunes())?.count || 0);
      setFokontanyCount((await geoApi.getFokontany())?.count || 0);

      /* ----------------------------
          STOCK + FINANCE DATA
      -----------------------------*/
      setAchatsCount((await stockApi.getDemandesAchat())?.count || 0);
      setDemandesCount((await financeApi.getDemandesDecaissement())?.count || 0);
      setLocationsCount((await financeApi.getLocations())?.count || 0);
      setPaiementsCount((await financeApi.getPaiements())?.count || 0);

    } catch (err) {
      console.error("Erreur dashboard :", err);
    }
  };

  /* ======================================================
      UI TEMPLATE
  ====================================================== */
  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Tableau de bord — {user?.full_name}
      </h1>

      {/* ======================================================
          SECTION KPI TOP
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <KpiCard icon={<Users />} label="Employés" value={employeesCount} color="green" />
        <KpiCard icon={<ClipboardList />} label="Congés" value={congesCount} color="yellow" />
        <KpiCard icon={<Briefcase />} label="Contrats" value={contratsCount} color="blue" />
        <KpiCard icon={<Layers />} label="Affectations" value={affectationsCount} color="purple" />

      </div>

      {/* ======================================================
          SECTION GEO
      ====================================================== */}
      <h2 className="text-xl font-semibold mb-3">Zone Géographique</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KpiCard icon={<Map />} label="Districts" value={districtsCount} color="orange" />
        <KpiCard icon={<MapPin />} label="Communes" value={communesCount} color="red" />
        <KpiCard icon={<Home />} label="Fokontany" value={fokontanyCount} color="teal" />
      </div>

      {/* ======================================================
          SECTION FINANCE + STOCK
      ====================================================== */}
      <h2 className="text-xl font-semibold mb-3">Finance & Achats</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard icon={<ShoppingCart />} label="Achats" value={achatsCount} color="indigo" />
        <KpiCard icon={<FileCheck />} label="Demandes Décaissement" value={demandesCount} color="pink" />
        <KpiCard icon={<Home />} label="Locations" value={locationsCount} color="cyan" />
        <KpiCard icon={<CreditCard />} label="Paiements" value={paiementsCount} color="green" />
      </div>

      {/* ======================================================
          GRAPH
      ====================================================== */}
      <Card className="p-4 bg-white shadow rounded-2xl border mb-10">
        <h2 className="text-lg font-semibold mb-4">Évolution des employés</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={employeeEvolution}>
            <XAxis dataKey="name" stroke="#4B5563" />
            <YAxis stroke="#4B5563" />
            <Tooltip />
            <Line type="monotone" dataKey="employees" stroke="#2563EB" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}

/* ======================================================
    COMPONENT KPI CARD
====================================================== */
function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-5 bg-white shadow-md border rounded-2xl hover:shadow-xl transition">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-700`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </Card>
  );
}
