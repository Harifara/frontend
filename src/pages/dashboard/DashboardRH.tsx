import { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
  FileText,
  ListChecks,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

type DashboardRHResponse = {
  kpi: {
    total_employes: number;
    employes_actifs: number;
    employes_conge: number;
    employes_inactifs: number;
    employes_suspendus: number;

    conges_en_attente: number;
    conges_en_cours: number;
    conges_refuses: number;

    contrats_actifs: number;
    contrats_expires: number;
    contrats_expirant_30j: number;

    affectations_actives: number;

    demandes_total: number;
    demandes_en_attente: number;
    demandes_validees: number;
    demandes_refusees: number;

    montant_achats: number;
    montant_payements: number;
  };
};

export default function DashboardRH() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<DashboardRHResponse["kpi"] | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await rhApi.getDashboardRH();
      setKpi(res.kpi);
    } catch (err) {
      console.error("Erreur dashboard RH", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement du dashboard RH...</div>;
  }

  if (!kpi) {
    return <div className="p-6 text-red-600">Erreur chargement dashboard</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Ressources Humaines</h1>

      {/* ================= KPI EMPLOYÉS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Employés</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard icon={Users} label="Total employés" value={kpi.total_employes} />
          <KPICard icon={UserCheck} label="Actifs" value={kpi.employes_actifs} />
          <KPICard icon={ClipboardList} label="En congé" value={kpi.employes_conge} />
          <KPICard icon={UserX} label="Suspendus" value={kpi.employes_suspendus} />
        </div>
      </div>

      {/* ================= KPI CONGÉS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Congés</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard icon={ClipboardList} label="En attente" value={kpi.conges_en_attente} />
          <KPICard icon={ListChecks} label="En cours" value={kpi.conges_en_cours} />
          <KPICard icon={UserX} label="Refusés" value={kpi.conges_refuses} />
        </div>
      </div>

      {/* ================= KPI CONTRATS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contrats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard icon={FileText} label="Actifs" value={kpi.contrats_actifs} />
          <KPICard icon={FileText} label="Expirés" value={kpi.contrats_expires} />
          <KPICard
            icon={FileText}
            label="Expire < 30 jours"
            value={kpi.contrats_expirant_30j}
          />
        </div>
      </div>

      {/* ================= KPI FINANCE ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Finance RH</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard icon={CreditCard} label="Demandes totales" value={kpi.demandes_total} />
          <KPICard icon={ClipboardList} label="En attente" value={kpi.demandes_en_attente} />
          <KPICard icon={ShoppingCart} label="Achats (Ar)" value={kpi.montant_achats} />
          <KPICard icon={CreditCard} label="Payements (Ar)" value={kpi.montant_payements} />
        </div>
      </div>
    </div>
  );
}
