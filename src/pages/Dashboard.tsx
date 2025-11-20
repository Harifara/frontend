import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  ClipboardList,
  Warehouse,
  FileText,
  MapPin,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

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

// Données fictives
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

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      {/* Titre */}
      <h1 className="text-2xl font-bold text-sidebar-foreground mb-6">
        Bonjour, {user?.full_name || user?.username}
      </h1>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(user.role === "admin" || user.role === "responsable_rh") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 bg-green-50 border border-green-200">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-green-700 mr-3" />
                <div>
                  <p className="text-lg font-semibold text-green-800">120</p>
                  <p className="text-sm text-green-700">Employés</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {(user.role === "admin" || user.role === "responsable_rh") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-4 bg-yellow-50 border border-yellow-200">
              <div className="flex items-center">
                <ClipboardList className="w-6 h-6 text-yellow-700 mr-3" />
                <div>
                  <p className="text-lg font-semibold text-yellow-800">8</p>
                  <p className="text-sm text-yellow-700">Congés en attente</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {(user.role === "admin" || user.role === "responsable_stock") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <Warehouse className="w-6 h-6 text-blue-700 mr-3" />
                <div>
                  <p className="text-lg font-semibold text-blue-800">5</p>
                  <p className="text-sm text-blue-700">Magasins</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {(user.role === "admin" || user.role === "responsable_stock" || user.role === "magasinier") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="p-4 bg-purple-50 border border-purple-200">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-purple-700 mr-3" />
                <div>
                  <p className="text-lg font-semibold text-purple-800">320</p>
                  <p className="text-sm text-purple-700">Articles en stock</p>
                  <Progress value={75} className="mt-2 h-2 rounded-full" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {(user.role === "admin" || user.role === "responsable_stock" || user.role === "magasinier") && (
          <Card className="p-4 border border-sidebar-accent/20">
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
              Stock par mois
            </h2>
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

        {(user.role === "admin" || user.role === "responsable_rh") && (
          <Card className="p-4 border border-sidebar-accent/20">
            <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
              Evolution des employés
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

      {/* Alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {recentStockMovements.map((item, idx) => (
          <Card key={idx} className="p-4 border border-red-200 bg-red-50 flex items-center">
            <AlertCircle className="w-6 h-6 text-red-700 mr-3" />
            <div>
              <p className="text-sm text-red-800 font-semibold">
                {item.article} → {item.magasin}
              </p>
              <p className="text-xs text-red-700">
                {item.qty > 0 ? `+${item.qty}` : item.qty} unités ({item.date})
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tableaux récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 border border-sidebar-accent/20">
          <h3 className="text-md font-semibold text-sidebar-foreground mb-2">
            Dernières affectations
          </h3>
          <table className="w-full text-sm text-sidebar-foreground/80">
            <thead>
              <tr className="text-left border-b border-sidebar-accent/20">
                <th className="py-2">Employé</th>
                <th>Magasin</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAffectations.map((item, idx) => (
                <tr key={idx} className="border-b border-sidebar-accent/10">
                  <td className="py-2">{item.employe}</td>
                  <td>{item.magasin}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 border border-sidebar-accent/20">
          <h3 className="text-md font-semibold text-sidebar-foreground mb-2">
            Congés récents
          </h3>
          <ul className="text-sm text-sidebar-foreground/70 space-y-1">
            <li>Marie Dupont - 3 jours</li>
            <li>Ali Raharisoa - 2 jours</li>
            <li>Lucien Rabe - 1 jour</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
