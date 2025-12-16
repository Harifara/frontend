import { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { CreditCard, DollarSign, FileText, ListChecks } from "lucide-react";

export default function DashboardFinance() {
  const [kpi, setKpi] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await financeApi.getDashboardFinance();
      setKpi(res.kpi);
    } catch (err) {
      console.error("Erreur dashboard finance", err);
    }
  };

  if (!kpi) return <div className="p-6">Chargement du dashboard Finance...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Finance</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <KPICard icon={DollarSign} label="Décaissements total" value={kpi.decaissements_total} />
        <KPICard icon={ListChecks} label="En attente" value={kpi.en_attente} />
        <KPICard icon={FileText} label="Approuvés" value={kpi.approuve} />
        <KPICard icon={CreditCard} label="Montant total dépensé" value={kpi.montant_total_depense} />
      </div>
    </div>
  );
}
