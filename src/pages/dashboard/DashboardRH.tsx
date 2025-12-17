// src/pages/rh/DashboardRH.tsx
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

// Types pour Dashboard RH
type KPI = {
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

type ListesRecente = {
  employes: any[];
  conges: any[];
  contrats: any[];
  affectations: any[];
  demandes: any[];
};

type DashboardRHResponse = {
  kpi: KPI;
  charts: Record<string, any>;
  lists: ListesRecente;
};

export default function DashboardRH() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardRHResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rhApi.getDashboardRH();
      if (!res || !res.kpi) throw new Error("Données invalides du dashboard RH");

      res.kpi.montant_achats = Number(res.kpi.montant_achats || 0);
      res.kpi.montant_payements = Number(res.kpi.montant_payements || 0);

      setData(res);
    } catch (err: any) {
      console.error("Erreur dashboard RH", err);
      setError(err.message || "Erreur lors du chargement du dashboard RH");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Chargement du dashboard RH...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;
  if (!data) return <div className="p-6 text-red-600">Pas de données disponibles</div>;

  const { kpi, lists } = data;

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
          <KPICard icon={FileText} label="Expire < 30 jours" value={kpi.contrats_expirant_30j} />
        </div>
      </div>

      {/* ================= KPI AFFECTATIONS ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Affectations</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <KPICard icon={ClipboardList} label="Affectations actives" value={kpi.affectations_actives} />
        </div>
      </div>

      {/* ================= KPI DEMANDES / FINANCE ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Demandes & Finance RH</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard icon={CreditCard} label="Demandes totales" value={kpi.demandes_total} />
          <KPICard icon={ClipboardList} label="En attente" value={kpi.demandes_en_attente} />
          <KPICard icon={ShoppingCart} label="Achats (Ar)" value={kpi.montant_achats} />
          <KPICard icon={CreditCard} label="Paiements (Ar)" value={kpi.montant_payements} />
        </div>
      </div>

      {/* ================= LISTES RÉCENTES ================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Derniers employés</h2>
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Fonction</th>
              <th className="px-4 py-2">District</th>
              <th className="px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lists.employes.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="px-4 py-2">{e.nom}</td>
                <td className="px-4 py-2">{e.fonction?.nom}</td>
                <td className="px-4 py-2">{e.district?.nom}</td>
                <td className="px-4 py-2">{e.status_employer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
