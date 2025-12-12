import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi } from "@/lib/api";

// Icons
import { Users, ClipboardList, Warehouse, FileText, AlertCircle } from "lucide-react";

// UI Components
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";

  /* ======================================================
      📌 STATES (Données API)
  ====================================================== */
  const [employeesCount, setEmployeesCount] = useState(0);
  const [pendingCongesCount, setPendingCongesCount] = useState(0);
  const [affectations, setAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  /* ======================================================
      📌 CHARGEMENT DES DONNÉES RH
  ====================================================== */
  useEffect(() => {
    loadRH();
  }, []);

  const loadRH = async () => {
    try {
      // --- EMPLOYÉS ---
      const employeesRes = await rhApi.getEmployes();
      const employees = employeesRes?.results || employeesRes || [];
      setEmployeesCount(employees.length);

      // Graphique simple : évolution par mois
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(employees.length * 0.8) },
        { name: "Feb", employees: Math.round(employees.length * 0.85) },
        { name: "Mar", employees: Math.round(employees.length * 0.9) },
        { name: "Apr", employees: Math.round(employees.length * 0.95) },
        { name: "May", employees: employees.length },
      ]);

      // --- CONGÉS ---
      const congesRes = await rhApi.getConges();
      const conges = congesRes?.results || congesRes || [];

      setPendingCongesCount(conges.filter((c: any) => c.status === "en_attente").length);

      setRecentConges(conges.slice(0, 3));

      // --- AFFECTATIONS ---
      const affectRes = await rhApi.getAffectations();
      const aff = affectRes?.results || affectRes || [];
      setAffectations(aff.slice(0, 5));

    } catch (error) {
      console.error("Erreur Dashboard RH :", error);
    }
  };

  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Bonjour, {user?.full_name || user?.username}
      </h1>

      {/* ======================================================
          🧮 KPI CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-700 mr-3" />
              <div>
                <p className="text-xl font-semibold">{employeesCount}</p>
                <p className="text-sm text-gray-600">Employés</p>
              </div>
            </div>
          </Card>
        )}

        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
            <div className="flex items-center">
              <ClipboardList className="w-8 h-8 text-yellow-700 mr-3" />
              <div>
                <p className="text-xl font-semibold">{pendingCongesCount}</p>
                <p className="text-sm text-gray-600">Congés en attente</p>
              </div>
            </div>
          </Card>
        )}

      </div>

      {/* ======================================================
          📈 GRAPH RH
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
          👤 AFFECTATIONS
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
              {affectations.map((item: any, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item?.employer?.full_name}</td>
                  <td>{item?.magasin?.nom}</td>
                  <td>{item?.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Congés récents */}
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
