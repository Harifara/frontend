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

// UI (adapte si nécessaire)
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

/**
 * Dashboard RH / STOCK / FINANCE / COORDO
 * - Affiche différentes sections selon le rôle de l'utilisateur
 * - Charge les données (rhApi/stockApi/financeApi/cordoApi)
 * - Tolérance : si l'API échoue, on affiche des données fictives
 */

/* ----- palette ----- */
const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

/* ----- helper KPI card ----- */
const KPICard = ({ Icon, label, value, sub }: any) => (
  <Card className="p-4 bg-white shadow rounded-2xl border hover:shadow-lg transition">
    <div className="flex items-center gap-4">
      <Icon className="w-8 h-8 text-slate-700" />
      <div>
        <div className="text-xl font-semibold">{value}</div>
        {sub && <div className="text-sm text-gray-500">{sub}</div>}
        {!sub && <div className="text-sm text-gray-500">{label}</div>}
      </div>
    </div>
  </Card>
);

/* ----- main component ----- */
export default function Dashboard() {
  const { user } = useAuth();

  // roles fournis
  const role = user?.role;
  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";

  /* ====== STATES ====== */
  // RH
  const [employeesCount, setEmployeesCount] = useState<number>(0);
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

  // lists + charts
  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

  // STOCK & FINANCE & COORDO (fictif par défaut)
  const [stockStats, setStockStats] = useState({
    articles: 0,
    demandesAchat: 0,
    ruptures: 0,
  });
  const [financeStats, setFinanceStats] = useState({
    decaissements: 0,
    valides: 0,
    enAttente: 0,
    rejetes: 0,
  });
  const [coordoStats, setCordoStats] = useState({
    validations: 0,
    aTraiter: 0,
  });

  // small loading flag
  const [loading, setLoading] = useState(true);

  /* ====== load all data with sensible fallbacks ====== */
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);

    // We'll try to load RH + Stock + Finance + Cordonator data in parallel.
    // If an API call fail, fallback to simple fictive data.
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
        // stock & finance & cordo
        stockArticlesRes,
        stockDemandesAchatRes,
        financeDecaissementsRes,
        cordoValidationsRes,
      ] = await Promise.all([
        // RH endpoints (may return paginated objects)
        rhApi.getEmployes().catch(() => ({ results: [] })),
        rhApi.getDistricts().catch(() => ({ results: [] })),
        rhApi.getCommunes().catch(() => ({ results: [] })),
        rhApi.getFokontanys().catch(() => ({ results: [] })),
        rhApi.getAffectations().catch(() => ({ results: [] })),
        rhApi.getConges().catch(() => ({ results: [] })),
        rhApi.getContrats().catch(() => ({ results: [] })),
        rhApi.getLocations().catch(() => ({ results: [] })),
        rhApi.getPayements().catch(() => ({ results: [] })),
        rhApi.getAchats().catch(() => ({ results: [] })),
        rhApi.getDemandes().catch(() => ({ results: [] })),

        // stockApi
        stockApi.getArticles?.().catch(() => ({ results: [] })),
        stockApi.getDemandesAchat?.().catch(() => ({ results: [] })),

        // financeApi
        financeApi.getDecaissements?.().catch(() => ({ results: [] })),

        // cordoApi
        cordoApi.getValidations?.().catch(() => ({ results: [] })),
      ]);

      // helpers to normalize paginated or array responses
      const normalize = (r: any) => {
        if (!r) return [];
        if (Array.isArray(r)) return r;
        if (r.results && Array.isArray(r.results)) return r.results;
        // in case API returns {data: [...]}
        if (r.data && Array.isArray(r.data)) return r.data;
        return [];
      };

      // RH normalizations
      const employes = normalize(employesRes);
      const districts = normalize(districtsRes);
      const communes = normalize(communesRes);
      const fokos = normalize(fokosRes);
      const affects = normalize(affectRes);
      const conges = normalize(congesRes);
      const contrats = normalize(contratsRes);
      const locations = normalize(locationsRes);
      const payements = normalize(payementsRes);
      const achats = normalize(achatsRes);
      const demandes = normalize(demandesRes);

      // set counts
      setEmployeesCount(employes.length);
      setDistrictsCount(districts.length);
      setCommunesCount(communes.length);
      setFokontanyCount(fokos.length);
      setAffectationsCount(affects.length);
      setCongesCount(conges.length);
      setPendingCongesCount(conges.filter((c: any) => c.status === "en_attente").length);
      setContratsCount(contrats.length);
      setLocationsCount(locations.length);
      setPaymentsCount(payements.length);
      setAchatsCount(achats.length);
      setDemandesCount(demandes.length);

      // lists
      setRecentAffectations(affects.slice(0, 6));
      setRecentConges(conges.slice(0, 6));

      // employeeEvolution: make a simple monthly series from total length (fictive but proportional)
      const total = Math.max(employes.length, 1);
      setEmployeeEvolution([
        { name: "Jan", employees: Math.round(total * 0.8) },
        { name: "Feb", employees: Math.round(total * 0.85) },
        { name: "Mar", employees: Math.round(total * 0.9) },
        { name: "Apr", employees: Math.round(total * 0.95) },
        { name: "May", employees: total },
      ]);

      // Stock & finance & cordo: normalize/fallback
      const stockArticles = normalize(stockArticlesRes);
      const stockDemandes = normalize(stockDemandesAchatRes);
      setStockStats({
        articles: stockArticles.length || 48,
        demandesAchat: stockDemandes.length || 12,
        ruptures: 5,
      });

      const decaissements = normalize(financeDecaissementsRes);
      setFinanceStats({
        decaissements: decaissements.length || 14,
        valides: decaissements.filter((d: any) => d.status === "valide").length || 8,
        enAttente: decaissements.filter((d: any) => d.status === "non_envoyee" || d.status === "en_attente").length || 4,
        rejetes: decaissements.filter((d: any) => d.status === "rejete").length || 2,
      });

      const validations = normalize(cordoValidationsRes);
      setCordoStats({
        validations: validations.length || 7,
        aTraiter: validations.filter((v: any) => v.decision === "non_traite").length || 2,
      });
    } catch (err) {
      console.error("Erreur loadAll :", err);
      // fallback to sensible defaults when any unexpected error
      setEmployeesCount(102);
      setDistrictsCount(12);
      setCommunesCount(34);
      setFokontanyCount(120);
      setAffectationsCount(32);
      setCongesCount(45);
      setPendingCongesCount(8);
      setContratsCount(95);
      setLocationsCount(8);
      setPaymentsCount(12);
      setAchatsCount(18);
      setDemandesCount(11);

      setStockStats({ articles: 48, demandesAchat: 12, ruptures: 5 });
      setFinanceStats({ decaissements: 14, valides: 8, enAttente: 4, rejetes: 2 });
      setCordoStats({ validations: 7, aTraiter: 2 });

      setEmployeeEvolution([
        { name: "Jan", employees: 85 },
        { name: "Feb", employees: 88 },
        { name: "Mar", employees: 92 },
        { name: "Apr", employees: 95 },
        { name: "May", employees: 98 },
      ]);
      setRecentAffectations([
        { employer: { full_name: "Rakoto Jean" }, magasin: { nom: "Magasin A" }, created_at: "2025-12-12T10:00:00Z" },
        { employer: { full_name: "Rasoa Marie" }, magasin: { nom: "Magasin B" }, created_at: "2025-12-10T10:00:00Z" },
      ]);
      setRecentConges([
        { employer: { full_name: "Nirina Soa" }, nb_jours: 4, status: "en_attente", created_at: "2025-12-11T12:00:00Z" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ====== small formatters ====== */
  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return iso.slice(0, 10);
    } catch {
      return iso;
    }
  };

  /* ====== UI ====== */
  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Bonjour, {user?.full_name || user?.username || "Utilisateur"}</h1>

      {/* role badges */}
      <div className="flex items-center gap-3 mb-6">
        <div className="px-3 py-1 rounded bg-slate-200 text-sm">{role || "rôle inconnu"}</div>
        {isAdmin && <div className="px-3 py-1 rounded bg-amber-100 text-sm">Admin</div>}
        {isRH && <div className="px-3 py-1 rounded bg-green-100 text-sm">RH</div>}
        {isStock && <div className="px-3 py-1 rounded bg-blue-100 text-sm">Stock</div>}
        {isMagasinier && <div className="px-3 py-1 rounded bg-indigo-100 text-sm">Magasinier</div>}
      </div>

      {/* KPI grid (show relevant KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* RH-visible */}
        {(isAdmin || isRH) && (
          <>
            <KPICard Icon={Users} label="Employés" value={employeesCount} sub={`${employeesCount} total`} />
            <KPICard Icon={ClipboardList} label="Congés en attente" value={pendingCongesCount} sub={`${congesCount} total`} />
            <KPICard Icon={ListChecks} label="Affectations" value={affectationsCount} sub="Mouvements récents" />
            <KPICard Icon={FileText} label="Contrats" value={contratsCount} sub="Contrats enregistrés" />
          </>
        )}

        {/* Stock-visible */}
        {(isAdmin || isStock || isMagasinier) && (
          <>
            <KPICard Icon={ShoppingCart} label="Articles en stock" value={stockStats.articles} sub={`${stockStats.ruptures} en rupture`} />
            <KPICard Icon={Map} label="Demandes d'achat" value={stockStats.demandesAchat} sub="En cours / à valider" />
          </>
        )}

        {/* Finance-visible */}
        {(isAdmin || role === "responsable_finance" || role === "finance") && (
          <>
            <KPICard Icon={CreditCard} label="Décaissements" value={financeStats.decaissements} sub={`${financeStats.valides} validés`} />
            <KPICard Icon={Building} label="Paiements" value={paymentsCount} sub="Transactions" />
          </>
        )}

        {/* Cordo-visible */}
        {(isAdmin || role === "coordinateur" || role === "coordo") && (
          <>
            <KPICard Icon={AlertCircle} label="Validations Coordo" value={coordoStats.validations} sub={`${coordoStats.aTraiter} à traiter`} />
          </>
        )}
      </div>

      {/* Charts and lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees evolution (RH) */}
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

        {/* Stock chart */}
        {(isAdmin || isStock || isMagasinier) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h3 className="font-semibold mb-3">Achats mensuels (fictif)</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={[
                  { name: "Jan", value: 22 }, { name: "Feb", value: 44 }, { name: "Mar", value: 33 },
                ]}>
                  <XAxis dataKey="name" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5a4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Pie: congés by status */}
        {(isAdmin || isRH) && (
          <Card className="p-4 bg-white shadow rounded-2xl border">
            <h3 className="font-semibold mb-3">Répartition congés (par status)</h3>
            <div style={{ width: "100%", height: 220 }} className="flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: "En attente", value: pendingCongesCount },
                      { name: "Autres", value: Math.max(congesCount - pendingCongesCount, 0) },
                    ]}
                    dataKey="value"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    <Cell fill={CHART_COLORS[0]} />
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
        {/* Recent affectations */}
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

        {/* Recent congés */}
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

      {/* footer quick stats */}
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
