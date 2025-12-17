// src/pages/finance/DashboardFinance.tsx
import { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import {
  CreditCard,
  DollarSign,
  FileText,
  ListChecks,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface KPIFinance {
  total_decaissements: number;
  decaissements_brouillon: number;
  decaissements_en_attente: number;
  decaissements_approuve: number;
  decaissements_rejete?: number;
  decaissements_effectues?: number;
  montant_total_decaisse?: number;
  montant_total_depense: number;
}

interface ChartItem {
  statut?: string;
  mode_paiement?: string;
  total: number;
}

export default function DashboardFinance() {
  const [kpi, setKpi] = useState<KPIFinance | null>(null);
  const [charts, setCharts] = useState<{
    decaissements_par_statut: ChartItem[];
    depenses_par_mode: ChartItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDashboardFinance();
      setKpi(res.kpi);
      setCharts(res.charts);
    } catch (err) {
      console.error("Erreur dashboard finance", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-6">Chargement du dashboard Finance...</div>;
  if (!kpi)
    return <div className="p-6 text-red-600">Impossible de charger les KPI</div>;

  const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Finance</h1>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <KPICard
          icon={DollarSign}
          label="Décaissements total"
          value={kpi.total_decaissements}
        />
        <KPICard
          icon={ListChecks}
          label="En attente"
          value={kpi.decaissements_en_attente}
        />
        <KPICard
          icon={FileText}
          label="Approuvés"
          value={kpi.decaissements_approuve}
        />
        <KPICard
          icon={CreditCard}
          label="Montant total dépensé"
          value={kpi.montant_total_depense.toLocaleString()}
        />
        <KPICard
          icon={FileText}
          label="Brouillons"
          value={kpi.decaissements_brouillon}
        />
      </div>

      {/* ================= CHARTS ================= */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Décaissements par statut */}
          <div className="bg-card rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-4">
              Décaissements par statut
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.decaissements_par_statut}
                  dataKey="total"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {charts.decaissements_par_statut.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Dépenses par mode de paiement */}
          <div className="bg-card rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-4">
              Dépenses par mode de paiement
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.depenses_par_mode}
                  dataKey="total"
                  nameKey="mode_paiement"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {charts.depenses_par_mode.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  );
}
