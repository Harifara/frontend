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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

  const { kpi, charts } = data;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Ressources Humaines</h1>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard icon={Users} label="Total employés" value={kpi.total_employes} />
        <KPICard icon={UserCheck} label="Actifs" value={kpi.employes_actifs} />
        <KPICard icon={ClipboardList} label="En congé" value={kpi.employes_conge} />
        <KPICard icon={UserX} label="Suspendus" value={kpi.employes_suspendus} />
        <KPICard icon={ClipboardList} label="Congés en attente" value={kpi.conges_en_attente} />
        <KPICard icon={ListChecks} label="Congés en cours" value={kpi.conges_en_cours} />
        <KPICard icon={UserX} label="Congés refusés" value={kpi.conges_refuses} />
        <KPICard icon={FileText} label="Contrats actifs" value={kpi.contrats_actifs} />
        <KPICard icon={FileText} label="Contrats expirés" value={kpi.contrats_expires} />
        <KPICard icon={FileText} label="Expire < 30 jours" value={kpi.contrats_expirant_30j} />
        <KPICard icon={ClipboardList} label="Affectations actives" value={kpi.affectations_actives} />
        <KPICard icon={CreditCard} label="Demandes totales" value={kpi.demandes_total} />
        <KPICard icon={ClipboardList} label="Demandes en attente" value={kpi.demandes_en_attente} />
        <KPICard icon={ShoppingCart} label="Achats (Ar)" value={kpi.montant_achats} />
        <KPICard icon={CreditCard} label="Paiements (Ar)" value={kpi.montant_payements} />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Employés par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.employes_par_statut}>
                <XAxis dataKey="status_employer" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#10b981" name="Nombre employés" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Congés par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.conges_par_statut}>
                <XAxis dataKey="status_conge" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#f59e0b" name="Nombre congés" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrats par nature</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.contrats_par_nature}>
                <XAxis dataKey="nature_contrat" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Nombre contrats" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.demandes_par_statut}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Nombre demandes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
