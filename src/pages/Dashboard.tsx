import React, { useEffect, useMemo, useState } from "react";
import { stockApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Package,
  AlertTriangle,
  Repeat,
  ShoppingCart,
  LogIn,
  LogOut,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Utils rôles                                                         */
/* ------------------------------------------------------------------ */

const hasRole = (userRole?: string, roles: string[] = []) =>
  userRole ? roles.includes(userRole) : false;

/* ------------------------------------------------------------------ */
/* Composant KPI                                                       */
/* ------------------------------------------------------------------ */

interface KPICardProps {
  label: string;
  value?: number;
  icon: React.ReactNode;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  color = "bg-gray-100",
}) => (
  <Card className="p-4 rounded-2xl shadow-sm border bg-white">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value ?? 0}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  </Card>
);

const COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

/* ------------------------------------------------------------------ */
/* Page Dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function DashboardStock() {
  const { user } = useAuth();

  const [kpi, setKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);
  const [entrees, setEntrees] = useState<any[]>([]);
  const [sorties, setSorties] = useState<any[]>([]);

  /* ---------------------------------------------------------------- */
  /* Chargement données                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await stockApi.getDashboardStock();
    setKpi(res.kpi ?? {});
    setStocks(res.stocks ?? []);
    setDemandesReappro(res.demandes_reappro ?? []);
    setDemandesAchat(res.demandes_achat ?? []);
    setEntrees(res.mouvements?.entrees ?? []);
    setSorties(res.mouvements?.sorties ?? []);
  };

  /* ---------------------------------------------------------------- */
  /* Charts                                                           */
  /* ---------------------------------------------------------------- */

  const pieMagasins = useMemo(() => {
    return stocks.reduce((acc: any[], s) => {
      const name = s.magasin?.nom ?? "Inconnu";
      const found = acc.find((a) => a.name === name);
      if (found) found.value += s.quantite;
      else acc.push({ name, value: s.quantite });
      return acc;
    }, []);
  }, [stocks]);

  const barReappro = useMemo(
    () =>
      demandesReappro.slice(0, 10).map((d) => ({
        article: d.article?.nom,
        quantite: d.quantite,
      })),
    [demandesReappro]
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard Stock</h1>

      {/* ===================== KPI ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {hasRole(user?.role, ["admin", "responsable_stock"]) && (
          <KPICard
            label="Total articles"
            value={kpi.total_articles}
            icon={<Package />}
            color="bg-teal-100 text-teal-700"
          />
        )}

        {hasRole(user?.role, ["admin", "responsable_stock"]) && (
          <KPICard
            label="Articles en rupture"
            value={kpi.articles_rupture}
            icon={<AlertTriangle />}
            color="bg-red-100 text-red-700"
          />
        )}

        {hasRole(user?.role, ["responsable_stock"]) && (
          <KPICard
            label="Demandes réappro en attente"
            value={kpi.demandes_reappro_en_attente}
            icon={<Repeat />}
            color="bg-amber-100 text-amber-700"
          />
        )}

        {hasRole(user?.role, ["responsable_finance"]) && (
          <KPICard
            label="Demandes d'achat"
            value={kpi.demandes_achat_en_attente}
            icon={<ShoppingCart />}
            color="bg-cyan-100 text-cyan-700"
          />
        )}

        {hasRole(user?.role, ["responsable_stock", "magasinier"]) && (
          <KPICard
            label="Entrées stock"
            value={kpi.total_entrees}
            icon={<LogIn />}
            color="bg-emerald-100 text-emerald-700"
          />
        )}

        {hasRole(user?.role, ["responsable_stock", "magasinier"]) && (
          <KPICard
            label="Sorties stock"
            value={kpi.total_sorties}
            icon={<LogOut />}
            color="bg-pink-100 text-pink-700"
          />
        )}
      </div>

      {/* ===================== CHARTS ===================== */}
      {hasRole(user?.role, ["admin", "responsable_stock"]) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Stocks par magasin</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieMagasins} dataKey="value" nameKey="name" label>
                  {pieMagasins.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top réapprovisionnement</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barReappro}>
                <XAxis dataKey="article" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantite" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ===================== TABLES ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks */}
        {hasRole(user?.role, ["responsable_stock", "magasinier"]) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Stocks</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Article</th>
                  <th>Magasin</th>
                  <th>Qté</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => (
                  <tr key={i} className="border-b">
                    <td>{s.article?.nom}</td>
                    <td>{s.magasin?.nom}</td>
                    <td>{s.quantite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Réappro */}
        {hasRole(user?.role, ["responsable_stock"]) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Demandes réappro</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Article</th>
                  <th>Qté</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {demandesReappro.map((d, i) => (
                  <tr key={i} className="border-b">
                    <td>{d.article?.nom}</td>
                    <td>{d.quantite}</td>
                    <td>
                      <Badge variant={d.statut === "en_attente" ? "destructive" : "default"}>
                        {d.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Achat */}
        {hasRole(user?.role, ["responsable_finance"]) && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Demandes d'achat</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Article</th>
                  <th>Qté</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {demandesAchat.map((d, i) => (
                  <tr key={i} className="border-b">
                    <td>{d.article?.nom}</td>
                    <td>{d.quantite}</td>
                    <td>
                      <Badge variant={d.statut === "en_attente" ? "destructive" : "default"}>
                        {d.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
