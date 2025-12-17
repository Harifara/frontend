// src/pages/finance/DashboardFinance.tsx
import { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { CreditCard, DollarSign, FileText, ListChecks } from "lucide-react";

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

export default function DashboardFinance() {
  const [kpi, setKpi] = useState<KPIFinance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDashboardFinance(); // doit renvoyer { kpi: {...} }
      setKpi(res.kpi);
    } catch (err) {
      console.error("Erreur dashboard finance", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Chargement du dashboard Finance...</div>;
  if (!kpi) return <div className="p-6 text-red-600">Impossible de charger les KPI</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Finance</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <KPICard
          icon={DollarSign}
          label="Décaissements total"
          value={kpi.total_decaissements ?? 0}
        />
        <KPICard
          icon={ListChecks}
          label="En attente"
          value={kpi.decaissements_en_attente ?? 0}
        />
        <KPICard
          icon={FileText}
          label="Approuvés"
          value={kpi.decaissements_approuve ?? 0}
        />
        <KPICard
          icon={CreditCard}
          label="Montant total dépensé"
          value={kpi.montant_total_depense?.toLocaleString() ?? 0}
        />
        <KPICard
          icon={FileText}
          label="Brouillons"
          value={kpi.decaissements_brouillon ?? 0}
        />
      </div>
      

      {/* Optionnel : autres KPI ou graphiques */}
      
    </div>
  );
}
