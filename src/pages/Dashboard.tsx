import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi, stockApi, financeApi, cordoApi } from "@/lib/api";

/* ================= ICONS ================= */
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

/* ================= UI ================= */
import { Card } from "@/components/ui/card";

/* ================= CHARTS ================= */
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

/* ================= CONSTANTS ================= */
const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

/* ================= HELPERS ================= */
const KPICard = ({ Icon, value, sub }: any) => (
  <Card className="p-4 bg-white rounded-2xl border shadow hover:shadow-lg transition">
    <div className="flex items-center gap-4">
      <Icon className="w-8 h-8 text-slate-700" />
      <div>
        <div className="text-xl font-semibold">{value}</div>
        <div className="text-sm text-gray-500">{sub}</div>
      </div>
    </div>
  </Card>
);

const formatDate = (iso?: string) => (iso ? iso.slice(0, 10) : "-");

const normalize = (r: any): any[] => {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  if (Array.isArray(r.results)) return r.results;
  if (Array.isArray(r.data)) return r.data;
  return [];
};

/* ================= MAIN ================= */
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "";

  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";
  const isFinance = ["responsable_finance", "finance"].includes(role);
  const isCoordo = ["coordinateur", "coordo"].includes(role);

  /* ================= STATES ================= */
  const [loading, setLoading] = useState(true);

  const [employes, setEmployes] = useState<any[]>([]);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [districtsCount, setDistrictsCount] = useState(0);
  const [communesCount, setCommunesCount] = useState(0);
  const [fokontanyCount, setFokontanyCount] = useState(0);
  const [affectationsCount, setAffectationsCount] = useState(0);
  const [congesCount, setCongesCount] = useState(0);
  const [pendingCongesCount, setPendingCongesCount] = useState(0);
  const [contratsCount, setContratsCount] = useState(0);
  const [locationsCount, setLocationsCount] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [achatsCount, setAchatsCount] = useState(0);
  const [demandesCount, setDemandesCount] = useState(0);

  const [recentAffectations, setRecentAffectations] = useState<any[]>([]);
  const [recentConges, setRecentConges] = useState<any[]>([]);
  const [employeeEvolution, setEmployeeEvolution] = useState<any[]>([]);

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

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadAll();
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
        rhApi.getEmployes?.(),
        rhApi.getDistricts?.(),
        rhApi.getCommunes?.(),
        rhApi.getFokontanys?.(),
        rhApi.getAffectations?.(),
        rhApi.getConges?.(),
        rhApi.getContrats?.(),
        rhApi.getLocations?.(),
        rhApi.getPayements?.(),
        rhApi.getAchats?.(),
        rhApi.getDemandes?.(),
        stockApi.getArticles?.(),
        stockApi.getDemandesAchat?.(),
        financeApi.getDecaissements?.(),
        cordoApi.getValidations?.(),
      ]);

      const emp = normalize(employesRes);
      const conges = normalize(congesRes);
      const decaissements = normalize(financeDecaissementsRes);
      const validations = normalize(cordoValidationsRes);

      setEmployes(emp);
      setEmployeesCount(emp.length);
      setDistrictsCount(normalize(districtsRes).length);
      setCommunesCount(normalize(communesRes).length);
      setFokontanyCount(normalize(fokosRes).length);
      setAffectationsCount(normalize(affectRes).length);
      setCongesCount(conges.length);
      setPendingCongesCount(
        conges.filter(c =>
          (c.status || c.status_conge || "").toLowerCase().includes("attente")
        ).length
      );
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

      setStockStats({
        articles: normalize(stockArticlesRes).length,
        demandesAchat: normalize(stockDemandesAchatRes).length,
        ruptures: 5,
      });

      setFinanceStats({
        decaissements: decaissements.length,
        valides: decaissements.filter(d => d.status === "valide").length,
        enAttente: decaissements.filter(d =>
          ["attente", "non_envoy"].includes(d.status)
        ).length,
        rejetes: decaissements.filter(d => d.status === "rejete").length,
      });

      setCordoStats({
        validations: validations.length,
        aTraiter: validations.filter(v => v.decision === "non_traite").length,
      });
    } catch (e) {
      console.error("Erreur Dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement du dashboard...</div>;
  }

  /* ================= RENDER ================= */
  return (
    <div className="p-6 flex-1 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        Bonjour, {user?.full_name || user?.username}
      </h1>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isAdmin || isRH) && (
          <>
            <KPICard Icon={Users} value={employeesCount} sub="Employés" />
            <KPICard Icon={ClipboardList} value={pendingCongesCount} sub="Congés en attente" />
            <KPICard Icon={ListChecks} value={affectationsCount} sub="Affectations" />
            <KPICard Icon={FileText} value={contratsCount} sub="Contrats" />
          </>
        )}

        {(isAdmin || isStock || isMagasinier) && (
          <>
            <KPICard Icon={ShoppingCart} value={stockStats.articles} sub="Articles en stock" />
            <KPICard Icon={Map} value={stockStats.demandesAchat} sub="Demandes d'achat" />
          </>
        )}

        {(isAdmin || isFinance) && (
          <>
            <KPICard Icon={CreditCard} value={financeStats.decaissements} sub="Décaissements" />
            <KPICard Icon={Building} value={paymentsCount} sub="Paiements" />
          </>
        )}

        {(isAdmin || isCoordo) && (
          <KPICard Icon={AlertCircle} value={coordoStats.validations} sub="Validations coordo" />
        )}
      </div>
    </div>
  );
}
