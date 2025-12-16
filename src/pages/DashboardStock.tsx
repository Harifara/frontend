// src/pages/DashboardStock.tsx
import React, { useEffect, useMemo, useState } from "react";
import { stockApi } from "@/lib/api";

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
  Sun,
  Moon,
  Package,
  AlertTriangle,
  Repeat,
  ShoppingCart,
  LogIn,
  LogOut,
} from "lucide-react";

const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

interface KPICardProps {
  label: string;
  value?: number;
  icon?: React.ReactNode;
  accentClass?: string;
  sub?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  accentClass = "bg-teal-100 text-teal-600",
  sub,
}) => (
  <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${accentClass}`}>{icon}</div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? 0}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{sub || label}</div>
      </div>
    </div>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-white/90 dark:bg-gray-800/90 px-3 py-2 text-sm shadow-md backdrop-blur-md">
      <div className="font-semibold text-gray-700 dark:text-gray-200">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color || p.fill }}
          />
          <span className="text-gray-600 dark:text-gray-300">
            {p.name}: <span className="font-semibold">{p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardStock() {
  const [kpi, setKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);
  const [entreesStock, setEntreesStock] = useState<any[]>([]);
  const [sortiesStock, setSortiesStock] = useState<any[]>([]);
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const loadDashboard = async () => {
    try {
      const res = await stockApi.getDashboardStock();
      setKpi(res.kpi ?? {});
      setStocks(res.stocks ?? []);
      setDemandesReappro(res.demandes_reappro ?? []);
      setDemandesAchat(res.demandes_achat ?? []);
      setEntreesStock(res.mouvements?.entrees ?? []);
      setSortiesStock(res.mouvements?.sorties ?? []);
    } catch (err) {
      console.error("Erreur dashboard stock :", err);
    }
  };

  // ----- Charts -----
  const pieMagasins = useMemo(() => {
    const base = stocks.reduce((acc: any[], s) => {
      const idx = acc.findIndex((a) => a.name === s.magasin?.nom);
      if (idx >= 0) acc[idx].value += s.quantite;
      else acc.push({ name: s.magasin?.nom ?? "Inconnu", value: s.quantite });
      return acc;
    }, []);
    return base.sort((a, b) => b.value - a.value);
  }, [stocks]);

  const barReappro = useMemo(
    () =>
      demandesReappro
        .map((d) => ({
          article: d.article?.nom ?? "-",
          quantite: d.quantite,
        }))
        .sort((a, b) => (b.quantite ?? 0) - (a.quantite ?? 0))
        .slice(0, 10),
    [demandesReappro]
  );

  const barRuptures = useMemo(() => {
    const rupturesParCategorie = stocks.reduce((acc: Record<string, number>, s) => {
      const seuil = s.article?.seuil_alerte ?? -Infinity;
      if (typeof s.quantite === "number" && s.quantite <= seuil) {
        const cat = s.article?.categorie?.nom ?? "Inconnue";
        acc[cat] = (acc[cat] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.entries(rupturesParCategorie)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stocks]);

  const barEntrees = useMemo(
    () =>
      entreesStock
        .map((e) => ({
          article: e.article?.nom ?? "-",
          quantite: e.quantite,
        }))
        .slice(-12),
    [entreesStock]
  );

  const barSorties = useMemo(
    () =>
      sortiesStock
        .map((s) => ({
          article: s.article?.nom ?? "-",
          quantite: s.quantite,
        }))
        .slice(-12),
    [sortiesStock]
  );

  return (
    <div className="p-6 flex-1 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Stock</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vue synthétique des stocks, demandes et mouvements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border bg-white/70 dark:bg-gray-900/60 px-4 py-2 text-sm shadow-sm hover:shadow-md transition backdrop-blur-md"
          >
            {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            <span className="text-gray-700 dark:text-gray-200">{dark ? "Mode clair" : "Mode sombre"}</span>
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KPICard
          label="Total articles"
          value={kpi.total_articles}
          icon={<Package className="h-6 w-6" />}
          accentClass="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
        />
        <KPICard
          label="Articles en rupture"
          value={kpi.articles_rupture}
          icon={<AlertTriangle className="h-6 w-6" />}
          accentClass="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        />
        <KPICard
          label="Demandes réappro en attente"
          value={kpi.demandes_reappro_en_attente}
          icon={<Repeat className="h-6 w-6" />}
          accentClass="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        />
        <KPICard
          label="Transferts en attente"
          value={kpi.transferts_en_attente}
          icon={<Repeat className="h-6 w-6" />}
          accentClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        />
        <KPICard
          label="Demandes d'achat en attente"
          value={kpi.demandes_achat_en_attente}
          icon={<ShoppingCart className="h-6 w-6" />}
          accentClass="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
        />
        <KPICard
          label="Total entrées"
          value={kpi.total_entrees}
          icon={<LogIn className="h-6 w-6" />}
          accentClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        />
        <KPICard
          label="Total sorties"
          value={kpi.total_sorties}
          icon={<LogOut className="h-6 w-6" />}
          accentClass="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Répartition des stocks par magasin
          </h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieMagasins}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                  isAnimationActive
                >
                  {pieMagasins.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Top 10 demandes réappro
          </h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={barReappro}>
                <XAxis dataKey="article" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="quantite" name="Quantité demandée" fill="#0ea5a4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Articles en rupture par catégorie
          </h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={barRuptures}>
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Nombre d'articles" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Entrées / Sorties Stock */}
     

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks récents */}
        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Stocks récents</h3>
          <div className="rounded-xl overflow-hidden border bg-white/60 dark:bg-gray-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-100/60 dark:bg-gray-800/60">
                  <th className="text-left px-3 py-2">Article</th>
                  <th className="text-left px-3 py-2">Magasin</th>
                  <th className="text-left px-3 py-2">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                      Aucun stock
                    </td>
                  </tr>
                ) : (
                  stocks.map((s, idx) => (
                    <tr
                      key={idx}
                      className="border-b odd:bg-gray-50/60 even:bg-white/40 dark:odd:bg-gray-800/40 dark:even:bg-gray-900/30"
                    >
                      <td className="px-3 py-2">{s.article?.nom ?? "-"}</td>
                      <td className="px-3 py-2">{s.magasin?.nom ?? "-"}</td>
                      <td className="px-3 py-2">{s.quantite}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Demandes réappro */}
        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Demandes de réapprovisionnement
          </h3>
          <div className="rounded-xl overflow-hidden border bg-white/60 dark:bg-gray-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-100/60 dark:bg-gray-800/60">
                  <th className="text-left px-3 py-2">Article</th>
                  <th className="text-left px-3 py-2">Magasin</th>
                  <th className="text-left px-3 py-2">Quantité</th>
                  <th className="text-left px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {demandesReappro.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                      Aucune demande
                    </td>
                  </tr>
                ) : (
                  demandesReappro.map((d, idx) => (
                    <tr
                      key={idx}
                      className="border-b odd:bg-gray-50/60 even:bg-white/40 dark:odd:bg-gray-800/40 dark:even:bg-gray-900/30"
                    >
                      <td className="px-3 py-2">{d.article?.nom ?? "-"}</td>
                      <td className="px-3 py-2">{d.magasin?.nom ?? "-"}</td>
                      <td className="px-3 py-2">{d.quantite ?? "-"}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={d.statut === "en_attente" ? "destructive" : "default"}
                          className="gap-2"
                        >
                          {d.statut === "en_attente" ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Repeat className="h-3.5 w-3.5" />
                          )}
                          {d.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Demandes d'achat */}
        <Card className="p-4 rounded-2xl border shadow-sm bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Demandes d'achat</h3>
          <div className="rounded-xl overflow-hidden border bg-white/60 dark:bg-gray-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-100/60 dark:bg-gray-800/60">
                  <th className="text-left px-3 py-2">Article</th>
                  <th className="text-left px-3 py-2">Quantité</th>
                  <th className="text-left px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {demandesAchat.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                      Aucune demande
                    </td>
                  </tr>
                ) : (
                  demandesAchat.map((d, idx) => (
                    <tr
                      key={idx}
                      className="border-b odd:bg-gray-50/60 even:bg-white/40 dark:odd:bg-gray-800/40 dark:even:bg-gray-900/30"
                    >
                      <td className="px-3 py-2">{d.article?.nom ?? "-"}</td>
                      <td className="px-3 py-2">{d.quantite ?? "-"}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={d.statut === "en_attente" ? "destructive" : "default"}
                          className="gap-2"
                        >
                          {d.statut === "en_attente" ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <ShoppingCart className="h-3.5 w-3.5" />
                          )}
                          {d.statut}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
