// src/pages/DashboardStock.tsx
import React, { useEffect, useState } from "react";
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
} from "recharts";

const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

interface KPICardProps {
  label: string;
  value?: number;
  sub?: string;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, color = "bg-white" }) => (
  <Card className={`p-4 shadow rounded-2xl border hover:shadow-lg transition ${color}`}>
    <div>
      <div className="text-xl font-semibold">{value ?? 0}</div>
      <div className="text-sm text-gray-500">{sub || label}</div>
    </div>
  </Card>
);

export default function DashboardStock() {
  const [kpi, setKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);
  const [entreesStock, setEntreesStock] = useState<any[]>([]);
  const [sortiesStock, setSortiesStock] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

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
  const pieMagasins = stocks.reduce((acc: any[], s) => {
    const idx = acc.findIndex(a => a.name === s.magasin?.nom);
    if (idx >= 0) acc[idx].value += s.quantite;
    else acc.push({ name: s.magasin?.nom ?? "Inconnu", value: s.quantite });
    return acc;
  }, []);

  const barReappro = demandesReappro.map(d => ({
    article: d.article?.nom ?? "-",
    quantite: d.quantite,
  })).slice(0, 10);

  const rupturesParCategorie = stocks.reduce((acc: Record<string, number>, s) => {
    if (s.quantite <= s.article?.seuil_alerte) {
      const cat = s.article?.categorie?.nom ?? "Inconnue";
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});
  const barRuptures = Object.entries(rupturesParCategorie).map(([name, value]) => ({ name, value }));

  const barEntrees = entreesStock.map(e => ({
    article: e.article?.nom ?? "-",
    quantite: e.quantite,
  }));

  const barSorties = sortiesStock.map(s => ({
    article: s.article?.nom ?? "-",
    quantite: s.quantite,
  }));

  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard Stock</h1>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard label="Total articles" value={kpi.total_articles} color="bg-teal-50" />
        <KPICard label="Articles en rupture" value={kpi.articles_rupture} color="bg-red-50" />
        <KPICard label="Demandes réappro en attente" value={kpi.demandes_reappro_en_attente} color="bg-yellow-50" />
        <KPICard label="Transferts en attente" value={kpi.transferts_en_attente} color="bg-blue-50" />
        <KPICard label="Demandes d'achat en attente" value={kpi.demandes_achat_en_attente} color="bg-cyan-50" />
        <KPICard label="Total entrées" value={kpi.total_entrees} color="bg-green-50" />
        <KPICard label="Total sorties" value={kpi.total_sorties} color="bg-pink-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Répartition des stocks par magasin</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieMagasins} dataKey="value" nameKey="name" outerRadius={80} label>
                  {pieMagasins.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Top 10 demandes réappro</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barReappro}>
                <XAxis dataKey="article" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Bar dataKey="quantite" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Articles en rupture par catégorie</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barRuptures}>
                <XAxis dataKey="name" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Entrées / Sorties Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Dernières entrées</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barEntrees}>
                <XAxis dataKey="article" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Bar dataKey="quantite" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Dernières sorties</h3>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barSorties}>
                <XAxis dataKey="article" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Bar dataKey="quantite" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks récents */}
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Stocks récents</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Article</th>
                <th>Magasin</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-gray-500">Aucun stock</td></tr>
              ) : stocks.map((s, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{s.article?.nom ?? "-"}</td>
                  <td>{s.magasin?.nom ?? "-"}</td>
                  <td>{s.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Demandes réappro */}
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Demandes de réapprovisionnement</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Article</th>
                <th>Magasin</th>
                <th>Quantité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandesReappro.length === 0 ? (
                <tr><td colSpan={4} className="py-2 text-gray-500">Aucune demande</td></tr>
              ) : demandesReappro.map((d, idx) => (
                <tr key={idx} className="border-b">
                  <td>{d.article?.nom ?? "-"}</td>
                  <td>{d.magasin?.nom ?? "-"}</td>
                  <td>{d.quantite ?? "-"}</td>
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

        {/* Demandes d'achat */}
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Demandes d'achat</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Article</th>
                <th>Quantité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandesAchat.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-gray-500">Aucune demande</td></tr>
              ) : demandesAchat.map((d, idx) => (
                <tr key={idx} className="border-b">
                  <td>{d.article?.nom ?? "-"}</td>
                  <td>{d.quantite ?? "-"}</td>
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
      </div>
    </div>
  );
}
