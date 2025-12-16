import { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { Users, ClipboardList, FileText, ListChecks } from "lucide-react";

export default function DashboardRH() {
  const [stats, setStats] = useState({
    employes: 0,
    congesAttente: 0,
    contrats: 0,
    affectations: 0,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [
      empRes,
      congesRes,
      contratsRes,
      affectRes,
    ] = await Promise.all([
      rhApi.getEmployes(),
      rhApi.getConges(),
      rhApi.getContrats(),
      rhApi.getAffectations(),
    ]);

    const conges = congesRes.results || [];

    setStats({
      employes: empRes.results.length,
      contrats: contratsRes.results.length,
      affectations: affectRes.results.length,
      congesAttente: conges.filter(c =>
        (c.status || "").includes("attente")
      ).length,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard RH</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard icon={Users} label="Employés" value={stats.employes} />
        <KPICard icon={ClipboardList} label="Congés en attente" value={stats.congesAttente} />
        <KPICard icon={FileText} label="Contrats" value={stats.contrats} />
        <KPICard icon={ListChecks} label="Affectations" value={stats.affectations} />
      </div>
    </div>
  );
}
