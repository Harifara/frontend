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
//   DASHBOARD RH
// ======================================================
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";

  // KPI STATES
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

  // Lists
  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  // ======================================================
  //   LOAD DASHBOARD DATA
  // ======================================================
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
        rhApi.getPayments(), // corrigé
        rhApi.getAchats(),
        rhApi.getDemandes(),
      ]);

      const emp = employees.results || employees;
      const aff = affectations.results || affectations;
      const co = conges.results || conges;

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
      });

      // Evolution fictive
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(emp.length * 0.8) },
        { name: "Feb", employees: Math.round(emp.length * 0.88) },
        { name: "Mar", employees: Math.round(emp.length * 0.93) },
        { name: "Apr", employees: Math.round(emp.length * 0.97) },
        { name: "May", employees: emp.length },
      ]);

      setRecentAffectations(aff.slice(0, 5));
      setRecentConges(co.slice(0, 5));
    } catch (error) {
      console.error("Erreur Dashboard :", error);
    }
  };

  // ======================================================
  //   COMPONENT KPI
  // ======================================================
  const KPICard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-4 bg-white shadow hover:shadow-xl rounded-2xl transition">
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 ${color}`} />
        <div>
          <p className="text-lg font-semibold">{value}</p>
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

      {/* ======================= KPI GRID ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard icon={Users} label="Employés" value={stats.employees} color="text-green-700" />
        <KPICard icon={Map} label="Districts" value={stats.districts} color="text-blue-600" />
        <KPICard icon={MapPin} label="Communes" value={stats.communes} color="text-purple-600" />
        <KPICard icon={Home} label="Fokontany" value={stats.fokontany} color="text-orange-600" />

        <KPICard icon={ListChecks} label="Affectations" value={stats.affectations} color="text-indigo-600" />
        <KPICard icon={ClipboardList} label="Congés en attente" value={stats.pendingConges} color="text-red-600" />
        <KPICard icon={FileText} label="Contrats" value={stats.contrats} color="text-cyan-600" />

        <KPICard icon={Building} label="Locations" value={stats.locations} color="text-yellow-600" />
        <KPICard icon={CreditCard} label="Paiements" value={stats.payments} color="text-lime-600" />
        <KPICard icon={ShoppingCart} label="Achats" value={stats.achats} color="text-sky-600" />
        <KPICard icon={ClipboardList} label="Demandes RH" value={stats.demandes} color="text-rose-600" />
      </div>

      {/* ======================= GRAPH ======================= */}
      {(isAdmin || isRH) && (
        <Card className="p-6 bg-white shadow rounded-2xl border mb-8">
          <h2 className="text-lg font-semibold mb-4">Évolution des employés</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={employeeEvolution}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line type="monotone" dataKey="employees" stroke="#007b83" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ======================= TABLEAU AFFECTATIONS + CONGÉS ======================= */}
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
              {recentAffectations.map((item, idx) => (
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
            {recentConges.map((c, idx) => (
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
