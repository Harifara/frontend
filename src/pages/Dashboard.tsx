import React from "react";
import { useAuth } from "@/contexts/AuthContext";

// Icons
import {
  Users,
  ClipboardList,
  Warehouse,
  FileText,
  AlertCircle,
} from "lucide-react";

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

/* ======================================================
   📊 Données fictives (tu pourras les remplacer par ton API)
====================================================== */
const stockData = [
  { name: "Jan", stock: 400 },
  { name: "Feb", stock: 300 },
  { name: "Mar", stock: 500 },
  { name: "Apr", stock: 450 },
  { name: "May", stock: 600 },
];

const employeesData = [
  { name: "Jan", employees: 20 },
  { name: "Feb", employees: 25 },
  { name: "Mar", employees: 22 },
  { name: "Apr", employees: 30 },
  { name: "May", employees: 28 },
];

const recentStockMovements = [
  { article: "Article A", magasin: "Magasin 1", qty: -5, date: "18/11/2025" },
  { article: "Article B", magasin: "Magasin 2", qty: +10, date: "17/11/2025" },
  { article: "Article C", magasin: "Magasin 1", qty: -2, date: "16/11/2025" },
];

const recentAffectations = [
  { employe: "John Doe", magasin: "Magasin A", date: "12/11/2025" },
  { employe: "Jane Smith", magasin: "Magasin B", date: "10/11/2025" },
  { employe: "Paul Martin", magasin: "Magasin C", date: "08/11/2025" },
];

/* ======================================================
   💻 DASHBOARD
====================================================== */
export default function Dashboard() {
  const { user } = useAuth();

  // Rôles
  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";

  return (
    <div className="p-6 flex-1 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Bonjour, {user?.full_name || user?.username || "Utilisateur"}
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
                <p className="text-xl font-semibold">120</p>
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
                <p className="text-xl font-semibold">8</p>
                <p className="text-sm text-gray-600">Congés en attente</p>
              </div>
            </div>
          </Card>
        )}

        {(isAdmin || isStock) && (
          <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
            <div className="flex items-center">
              <Warehouse className="w-8 h-8 text-blue-700 mr-3" />
              <div>
                <p className="text-xl font-semibold">5</p>
                <p className="text-sm text-gray-600">Magasins</p>
              </div>
            </div>
          </Card>
        )}

        {(isAdmin || isStock || isMagasinier) && (
          <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-700 mr-3" />
              <div className="w-full">
                <p className="text-xl font-semibold">320</p>
                <p className="text-sm text-gray-600">Articles en stock</p>
                <Progress value={75} className="mt-2 h-2 rounded-full" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ======================================================
          📈 GRAPHIQUES
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {(isAdmin || isStock || isMagasinier) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h2 className="text-lg font-semibold mb-4">Stock par mois</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockData}>
                <XAxis dataKey="name" stroke="#4B5563" />
                <YAxis stroke="#4B5563" />
                <Tooltip />
                <Bar dataKey="stock" fill="#0A6847" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h2 className="text-lg font-semibold mb-4">
              Évolution des employés
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={employeesData}>
                <XAxis dataKey="name" stroke="#4B5563" />
                <YAxis stroke="#4B5563" />
                <Tooltip />
                <Line type="monotone" dataKey="employees" stroke="#297373" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ======================================================
          🚨 ALERTES / MOUVEMENTS STOCK
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {recentStockMovements.map((item, idx) => (
          <Card
            key={idx}
            className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow flex items-center"
          >
            <AlertCircle className="w-6 h-6 text-red-700 mr-3" />
            <div>
              <p className="font-semibold text-red-800">
                {item.article} → {item.magasin}
              </p>
              <p className="text-xs text-red-700">
                {item.qty > 0 ? `+${item.qty}` : item.qty} unités ({item.date})
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* ======================================================
          TABLEAUX
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Affectations */}
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
                  <td className="py-2">{item.employe}</td>
                  <td>{item.magasin}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Congés récents */}
        <Card className="p-4 bg-white shadow rounded-2xl border">
          <h3 className="text-md font-semibold mb-3">Congés récents</h3>
          <ul className="text-sm space-y-1">
            <li>Marie Dupont — 3 jours</li>
            <li>Ali Raharisoa — 2 jours</li>
            <li>Lucien Rabe — 1 jour</li>
          </ul>
        </Card>

      </div>
    </div>
  );
}
