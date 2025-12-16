import { useEffect, useState } from "react";
import { cordoApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function DashboardCoordo() {
  const [stats, setStats] = useState({ total: 0, aTraiter: 0 });

  useEffect(() => {
    cordoApi.getValidations().then(res => {
      setStats({
        total: res.results.length,
        aTraiter: res.results.filter(v => v.decision === "non_traite").length,
      });
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Coordination</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard icon={CheckCircle} label="Validations" value={stats.total} />
        <KPICard icon={AlertCircle} label="À traiter" value={stats.aTraiter} />
      </div>
    </div>
  );
}
