// src/pages/DashboardStock.tsx
import React, { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

const KPICard = ({ label, value, sub, color = "bg-white" }: any) => (
  <Card className={`p-4 shadow rounded-2xl border hover:shadow-lg transition ${color}`}>
    <div>
      <div className="text-xl font-semibold">{value ?? 0}</div>
      <div className="text-sm text-gray-500">{sub || label}</div>
    </div>
  </Card>
);

const formatDate = (iso?: string) => iso?.slice(0, 10) ?? "-";

export default function DashboardStock() {
  const [kpi, setKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await stockApi.getDashboardStock(); // appelle /dashboard-stock/
      setKpi(res.kpi ?? {});
      setStocks(res.stocks ?? []);
      setDemandesReappro(res.demandes_reappro ?? []);
      setDemandesAchat(res.demandes_achat ?? []);
    } catch (err) {
      console.error("Erreur dashboard stock :", err);
    }
  };

  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard Stock</h1>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard label="Total articles" value={kpi.total_articles} color="bg-teal-50" />
        <KPICard label="Articles en rupture" value={kpi.articles_rupture} color="bg-red-50" />
        <KPICard label="Demandes réappro en attente" value={kpi.demandes_en_attente} color="bg-yellow-50" />
        <KPICard label="Transferts en attente" value={kpi.transferts_en_attente} color="bg-blue-50" />
        <KPICard label="Demandes d'achat en attente" value={kpi.demandes_achat_en_attente} color="bg-cyan-50" />
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stocks */}
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Stocks récents</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Article</th>
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
