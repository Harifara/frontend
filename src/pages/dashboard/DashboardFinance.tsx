import { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

export default function DashboardFinance() {
  const [stats, setStats] = useState({
    total: 0,
    attente: 0,
    valide: 0,
    rejete: 0,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await financeApi.getDecaissements();
    const d = res.results;

    setStats({
      total: d.length,
      attente: d.filter(x => x.status === "attente").length,
      valide: d.filter(x => x.status === "valide").length,
      rejete: d.filter(x => x.status === "rejete").length,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Finance</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard icon={CreditCard} label="Total" value={stats.total} />
        <KPICard icon={Clock} label="En attente" value={stats.attente} />
        <KPICard icon={CheckCircle} label="Validés" value={stats.valide} />
        <KPICard icon={XCircle} label="Rejetés" value={stats.rejete} />
      </div>
    </div>
  );
}
