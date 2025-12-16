// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi, stockApi, financeApi, cordoApi } from "@/lib/api";

// icons
import {
  Users,
  ClipboardList,
  Map,
  MapPin,
  Home,
  Building,
  FileText,
  ShoppingCart,
  CreditCard,
  ListChecks,
  AlertCircle,
} from "lucide-react";

// UI
import { Card } from "@/components/ui/card";

// charts
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
const KPICard = ({ Icon, label, value, sub }: any) => (
  <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
    <div className="flex items-center gap-4">
      <Icon className="w-8 h-8 text-slate-700" />
      <div>
        <div className="text-xl font-semibold">{value}</div>
        {sub ? <div className="text-sm text-gray-500">{sub}</div> : <div className="text-sm text-gray-500">{label}</div>}
      </div>
    </div>
  </Card>
);

/* ----- format helper ----- */
const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return iso.slice(0, 10);
  } catch {
    return iso;
  }
};

/* ----- main component ----- */
export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";

  /* ====== STATES ====== */
  const [employeesCount, setEmployeesCount] = useState<number>(0);
  const [employes, setEmployes] = useState<any[]>([]); // <-- state ajouté pour les filtres sexe
  const [districtsCount, setDistrictsCount] = useState<number>(0);
  const [communesCount, setCommunesCount] = useState<number>(0);
  const [fokontanyCount, setFokontanyCount] = useState<number>(0);
  const [affectationsCount, setAffectationsCount] = useState<number>(0);
  const [congesCount, setCongesCount] = useState<number>(0);
  const [pendingCongesCount, setPendingCongesCount] = useState<number>(0);
  const [contratsCount, setContratsCount] = useState<number>(0);
  const [locationsCount, setLocationsCount] = useState<number>(0);
  const [paymentsCount, setPaymentsCount] = useState<number>(0);
  const [achatsCount, setAchatsCount] = useState<number>(0);
  const [demandesCount, setDemandesCount] = useState<number>(0);

  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  const [stockStats, setStockStats] = useState({ articles: 0, demandesAchat: 0, ruptures: 0 });
  const [financeStats, setFinanceStats] = useState({ decaissements: 0, valides: 0, enAttente: 0, rejetes: 0 });
  const [coordoStats, setCordoStats] = useState({ validations: 0, aTraiter: 0 });

  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        employesRes,
        districtsRes,
        communesRes,
        fokosRes,
        affectRes,
        congesRes,
        contratsRes,
        locationsRes,
        payementsRes,
        achatsRes,
        demandesRes,
        stockArticlesRes,
        stockDemandesAchatRes,
        financeDecaissementsRes,
        cordoValidationsRes,
      ] = await Promise.all([
        rhApi.getEmployes().catch(() => ({ results: [] })),
        rhApi.getDistricts().catch(() => ({ results: [] })),
        rhApi.getCommunes().catch(() => ({ results: [] })),
        rhApi.getFokontanys?.().catch(() => ({ results: [] })),
        rhApi.getAffectations().catch(() => ({ results: [] })),
        rhApi.getConges().catch(() => ({ results: [] })),
        rhApi.getContrats().catch(() => ({ results: [] })),
        rhApi.getLocations().catch(() => ({ results: [] })),
        rhApi.getPayements?.().catch(() => ({ results: [] })),
        rhApi.getAchats().catch(() => ({ results: [] })),
        rhApi.getDemandes().catch(() => ({ results: [] })),
        stockApi.getArticles?.().catch(() => ({ results: [] })),
        stockApi.getDemandesAchat?.().catch(() => ({ results: [] })),
        financeApi.getDecaissements?.().catch(() => ({ results: [] })),
        cordoApi.getValidations?.().catch(() => ({ results: [] })),
      ]);

      const emp = normalize(employesRes);
      setEmployes(emp); // <-- set dans state
      setEmployeesCount(emp.length);
      setDistrictsCount(normalize(districtsRes).length);
      setCommunesCount(normalize(communesRes).length);
      setFokontanyCount(normalize(fokosRes).length);
      setAffectationsCount(normalize(affectRes).length);
      const conges = normalize(congesRes);
      setCongesCount(conges.length);
      setPendingCongesCount(conges.filter((c: any) => (c.status_conge || c.status || "").toString().toLowerCase().includes("attente")).length);
      setContratsCount(normalize(contratsRes).length);
      setLocationsCount(normalize(locationsRes).length);
      setPaymentsCount(normalize(payementsRes).length);
      setAchatsCount(normalize(achatsRes).length);
      setDemandesCount(normalize(demandesRes).length);

      setRecentAffectations(normalize(affectRes).slice(0, 6));
      setRecentConges(conges.slice(0, 6));

      const total = Math.max(emp.length, 1);
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(total * 0.8) },
        { name: "Feb", employees: Math.round(total * 0.85) },
        { name: "Mar", employees: Math.round(total * 0.9) },
        { name: "Apr", employees: Math.round(total * 0.95) },
        { name: "May", employees: total },
      ]);

      setStockStats({ articles: normalize(stockArticlesRes).length || 48, demandesAchat: normalize(stockDemandesAchatRes).length || 12, ruptures: 5 });

      const decaissements = normalize(financeDecaissementsRes);
      setFinanceStats({
        decaissements: decaissements.length || 14,
        valides: decaissements.filter((d: any) => (d.status || "").toLowerCase() === "valide").length || 8,
        enAttente: decaissements.filter((d: any) => ((d.status || "").toLowerCase().includes("attente") || (d.status || "").toLowerCase().includes("non_envoy"))).length || 4,
        rejetes: decaissements.filter((d: any) => (d.status || "").toLowerCase() === "rejete").length || 2,
      });

      const validations = normalize(cordoValidationsRes);
      setCordoStats({
        validations: validations.length || 7,
        aTraiter: validations.filter((v: any) => (v.decision || "").toLowerCase() === "non_traite").length || 2,
      });
    } catch (err) {
      console.error("Erreur loadAll :", err);
      setEmployes([]);
      setEmployeesCount(0);
      setDistrictsCount(0);
      setCommunesCount(0);
      setFokontanyCount(0);
      setAffectationsCount(0);
      setCongesCount(0);
      setPendingCongesCount(0);
      setContratsCount(0);
      setLocationsCount(0);
      setPaymentsCount(0);
      setAchatsCount(0);
      setDemandesCount(0);
      setRecentAffectations([]);
      setRecentConges([]);
      setEmployeeEvolution([]);
      setStockStats({ articles: 48, demandesAchat: 12, ruptures: 5 });
      setFinanceStats({ decaissements: 14, valides: 8, enAttente: 4, rejetes: 2 });
      setCordoStats({ validations: 7, aTraiter: 2 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Bonjour, {user?.full_name || user?.username || "Utilisateur"}</h1>

      {/* Role badges */}
      <div className="flex items-center gap-3 mb-6">
        <div className="px-3 py-1 rounded bg-slate-200 text-sm">{role || "rôle inconnu"}</div>
        {isAdmin && <div className="px-3 py-1 rounded bg-amber-100 text-sm">Admin</div>}
        {isRH && <div className="px-3 py-1 rounded bg-green-100 text-sm">RH</div>}
        {isStock && <div className="px-3 py-1 rounded bg-blue-100 text-sm">Stock</div>}
        {isMagasinier && <div className="px-3 py-1 rounded bg-indigo-100 text-sm">Magasinier</div>}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isAdmin || isRH) && (
          <>
            <KPICard Icon={Users} label="Employés" value={employeesCount} sub={`${employeesCount} total`} />
            <KPICard Icon={ClipboardList} label="Congés en attente" value={pendingCongesCount} sub={`${congesCount} total`} />
            <KPICard Icon={ListChecks} label="Affectations" value={affectationsCount} sub="Mouvements récents" />
            <KPICard Icon={FileText} label="Contrats" value={contratsCount} sub="Contrats enregistrés" />
          </>
        )}
        {(isAdmin || isStock || isMagasinier) && (
          <>
            <KPICard Icon={ShoppingCart} label="Articles en stock" value={stockStats.articles} sub={`${stockStats.ruptures} en rupture`} />
            <KPICard Icon={Map} label="Demandes d'achat" value={stockStats.demandesAchat} sub="En cours / à valider" />
          </>
        )}
        {(isAdmin || role === "responsable_finance" || role === "finance") && (
          <>
            <KPICard Icon={CreditCard} label="Décaissements" value={financeStats.decaissements} sub={`${financeStats.valides} validés`} />
            <KPICard Icon={Building} label="Paiements" value={paymentsCount} sub="Transactions" />
          </>
        )}
        {(isAdmin || role === "coordinateur" || role === "coordo") && (
          <>
            <KPICard Icon={AlertCircle} label="Validations Coordo" value={coordoStats.validations} sub={`${coordoStats.aTraiter} à traiter`} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h3 className="font-semibold mb-3">Évolution des employés (fictif)</h3>
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
        )}

        {(isAdmin || isStock || isMagasinier) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h3 className="font-semibold mb-3">Achats mensuels (fictif)</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={[{ name: "Jan", value: 22 }, { name: "Feb", value: 44 }, { name: "Mar", value: 33 }]}>
                  <XAxis dataKey="name" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5a4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h3 className="font-semibold mb-3">Répartition des employés (par sexe)</h3>
            <div style={{ width: "100%", height: 220 }} className="flex items-center justify-center">
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
        )}
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-4 bg-white shadow rounded-2xl border">
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
              ) : (
                recentAffectations.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item?.employer?.full_name ?? item?.employer ?? "—"}</td>
                    <td>{item?.magasin?.nom ?? item?.nouveau_district?.name ?? "-"}</td>
                    <td>{formatDate(item?.created_at ?? item?.date_creation_affectation)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 bg-white shadow rounded-2xl border">
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
              ) : (
                recentConges.map((c, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{c?.employer?.full_name ?? "—"}</td>
                    <td>{c?.nb_jours ?? c?.nombre_jours ?? "-"}</td>
                    <td>{c?.status ?? c?.status_conge ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* footer stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <div className="text-sm text-gray-500">Districts</div>
          <div className="text-2xl font-bold">{districtsCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <div className="text-sm text-gray-500">Communes</div>
          <div className="text-2xl font-bold">{communesCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <div className="text-sm text-gray-500">Locations</div>
          <div className="text-2xl font-bold">{locationsCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <div className="text-sm text-gray-500">Demandes RH</div>
          <div className="text-2xl font-bold">{demandesCount}</div>
        </div>
      </div>
    </div>
  );
}
