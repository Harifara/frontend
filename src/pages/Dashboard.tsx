// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi, stockApi, financeApi, cordoApi } from "@/lib/api";

import {
  Users,
  ClipboardList,
  Map,
  Building,
  FileText,
  ShoppingCart,
  CreditCard,
  ListChecks,
  AlertCircle,
} from "lucide-react";

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

/* ----- palette ----- */
const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

/* ----- KPI Card helper ----- */
const KPICard = ({ Icon, label, value, sub, color = "bg-white" }: any) => (
  <Card className={`p-4 shadow rounded-2xl border hover:shadow-lg transition ${color}`}>
    <div className="flex items-center gap-4">
      <Icon className="w-8 h-8 text-gray-700" />
      <div>
        <div className="text-xl font-semibold">{value}</div>
        <div className="text-sm text-gray-500">{sub || label}</div>
      </div>
    </div>
  </Card>
);

/* ----- format helper ----- */
const formatDate = (iso?: string) => iso ? iso.slice(0, 10) : "-";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const [employeesCount, setEmployeesCount] = useState(0);
  const [employes, setEmployes] = useState<any[]>([]);
  const [pendingCongesCount, setPendingCongesCount] = useState(0);
  const [affectationsCount, setAffectationsCount] = useState(0);
  const [contratsCount, setContratsCount] = useState(0);
  const [stockStats, setStockStats] = useState({ articles: 0, demandesAchat: 0, ruptures: 0 });
  const [financeStats, setFinanceStats] = useState({ decaissements: 0, valides: 0, enAttente: 0, rejetes: 0 });
  const [coordoStats, setCordoStats] = useState({ validations: 0, aTraiter: 0 });
  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  /* ====== helper ====== */
  const normalize = (r: any) => {
    if (!r) return [];
    if (Array.isArray(r)) return r;
    if (r.results && Array.isArray(r.results)) return r.results;
    if (r.data && Array.isArray(r.data)) return r.data;
    return [];
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [
        employesRes,
        affectRes,
        congesRes,
        contratsRes,
        stockArticlesRes,
        stockDemandesAchatRes,
        financeDecaissementsRes,
        cordoValidationsRes,
      ] = await Promise.all([
        rhApi.getEmployes().catch(() => ({ results: [] })),
        rhApi.getAffectations().catch(() => ({ results: [] })),
        rhApi.getConges().catch(() => ({ results: [] })),
        rhApi.getContrats().catch(() => ({ results: [] })),
        stockApi.getArticles?.().catch(() => ({ results: [] })),
        stockApi.getDemandesAchat?.().catch(() => ({ results: [] })),
        financeApi.getDecaissements?.().catch(() => ({ results: [] })),
        cordoApi.getValidations?.().catch(() => ({ results: [] })),
      ]);

      const emp = normalize(employesRes);
      const conges = normalize(congesRes);
      const decaissements = normalize(financeDecaissementsRes);
      const validations = normalize(cordoValidationsRes);

      // Filtrage selon utilisateur
      const filteredAffectations = normalize(affectRes).filter(
        item => role === "admin" || item?.employer?.id === user.id
      );

      const filteredConges = conges.filter(
        c => role === "admin" || c?.employer?.id === user.id
      );

      const filteredEmployees = role === "admin" ? emp : emp.filter(e => e.id === user.id);

      setEmployes(filteredEmployees);
      setEmployeesCount(filteredEmployees.length);
      setPendingCongesCount(filteredConges.filter(c => (c.status_conge || c.status || "").toLowerCase().includes("attente")).length);
      setAffectationsCount(filteredAffectations.length);
      setContratsCount(normalize(contratsRes).length);

      setStockStats({
        articles: normalize(stockArticlesRes).length,
        demandesAchat: normalize(stockDemandesAchatRes).length,
        ruptures: 5,
      });

      setFinanceStats({
        decaissements: decaissements.length,
        valides: decaissements.filter((d: any) => (d.status || "").toLowerCase() === "valide").length,
        enAttente: decaissements.filter((d: any) => (d.status || "").toLowerCase().includes("attente")).length,
        rejetes: decaissements.filter((d: any) => (d.status || "").toLowerCase() === "rejete").length,
      });

      setCordoStats({
        validations: validations.length,
        aTraiter: validations.filter((v: any) => (v.decision || "").toLowerCase() === "non_traite").length,
      });

      setRecentAffectations(filteredAffectations.slice(0, 6));
      setRecentConges(filteredConges.slice(0, 6));

      const total = Math.max(filteredEmployees.length, 1);
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(total * 0.8) },
        { name: "Feb", employees: Math.round(total * 0.85) },
        { name: "Mar", employees: Math.round(total * 0.9) },
        { name: "Apr", employees: Math.round(total * 0.95) },
        { name: "May", employees: total },
      ]);

    } catch (err) {
      console.error("Erreur loadAll :", err);
    }
  };

  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Bonjour, {user?.full_name || user?.username}</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(role === "admin" || role === "responsable_rh") && (
          <>
            <KPICard Icon={Users} label="Employés" value={employeesCount} sub="Total employés" color="bg-teal-50" />
            <KPICard Icon={ClipboardList} label="Congés en attente" value={pendingCongesCount} sub="Congés récents" color="bg-yellow-50" />
            <KPICard Icon={ListChecks} label="Affectations" value={affectationsCount} sub="Mouvements récents" color="bg-blue-50" />
            <KPICard Icon={FileText} label="Contrats" value={contratsCount} sub="Contrats enregistrés" color="bg-purple-50" />
          </>
        )}

        {(role === "admin" || role === "responsable_stock" || role === "magasinier") && (
          <>
            <KPICard Icon={ShoppingCart} label="Articles en stock" value={stockStats.articles} sub={`${stockStats.ruptures} en rupture`} color="bg-blue-50" />
            <KPICard Icon={Map} label="Demandes d'achat" value={stockStats.demandesAchat} sub="En cours / à valider" color="bg-cyan-50" />
          </>
        )}

        {(role === "admin" || role === "finance" || role === "responsable_finance") && (
          <KPICard Icon={CreditCard} label="Décaissements" value={financeStats.decaissements} sub={`${financeStats.valides} validés`} color="bg-green-50" />
        )}

        {(role === "admin" || role === "coordinateur" || role === "coordo") && (
          <KPICard Icon={AlertCircle} label="Validations Coordo" value={coordoStats.validations} sub={`${coordoStats.aTraiter} à traiter`} color="bg-red-50" />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Évolution des employés</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={employeeEvolution}>
                <XAxis dataKey="name" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Line type="monotone" dataKey="employees" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Répartition des employés (sexe)</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: "Masculin", value: employes.filter(e => e.sexe === "M").length },
                    { name: "Féminin", value: employes.filter(e => e.sexe === "F").length },
                    { name: "Non renseigné", value: employes.filter(e => !e.sexe).length },
                  ]}
                  dataKey="value"
                  outerRadius={80}
                  label
                >
                  <Cell fill={CHART_COLORS[0]} />
                  <Cell fill={CHART_COLORS[1]} />
                  <Cell fill={CHART_COLORS[2]} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Achats mensuels</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={[
                  { name: "Jan", value: stockStats.demandesAchat },
                  { name: "Feb", value: stockStats.demandesAchat },
                  { name: "Mar", value: stockStats.demandesAchat },
                ]}
              >
                <XAxis dataKey="name" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Dernières affectations</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Employé</th>
                <th className="text-left">Magasin / District</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAffectations.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-gray-500">Aucune affectation récente</td></tr>
              ) : recentAffectations.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item?.employer?.full_name ?? "—"}</td>
                  <td>{item?.magasin?.nom ?? item?.nouveau_district?.name ?? "-"}</td>
                  <td>{formatDate(item?.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 shadow rounded-2xl border">
          <h3 className="font-semibold mb-3">Congés récents</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Employé</th>
                <th className="text-left">Jours</th>
                <th className="text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentConges.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-gray-500">Aucun congé récent</td></tr>
              ) : recentConges.map((c, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{c?.employer?.full_name ?? "—"}</td>
                  <td>{c?.nb_jours ?? "-"}</td>
                  <td>
                    <Badge variant={c.status?.toLowerCase().includes("attente") ? "destructive" : "default"}>
                      {c?.status ?? "-"}
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
