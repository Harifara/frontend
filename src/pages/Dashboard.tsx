// ==========================================
// 📁 lib/api.ts
// ==========================================
import axios from "axios";

export const rhApi = axios.create({
  baseURL: "/api/rh",
  headers: { "Content-Type": "application/json" },
});

export const stockApi = axios.create({
  baseURL: "/api/stock",
  headers: { "Content-Type": "application/json" },
});

export const getDashboardStock = () => stockApi.get("/dashboard-stock/").then(res => res.data);

// ==========================================
// 📁 Dashboard.tsx
// ==========================================
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi, getDashboardStock } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Loader2, Sun, Moon, Package, AlertTriangle, Repeat, ShoppingCart } from "lucide-react";

/* =====================================================
   🔐 ROLES
===================================================== */
export default function Dashboard() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isRH = user?.role === "responsable_rh";
  const isStock = user?.role === "responsable_stock" || user?.role === "magasinier";

  return (
    <div className="w-full">
      {(isAdmin || isRH) && <DashboardRH />}
      {(isAdmin || isStock) && <DashboardStock />}
    </div>
  );
}

/* =====================================================
   ================= DASHBOARD RH ======================
===================================================== */
function DashboardRH() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rhApi.get("/dashboard-rh/")
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8" /></div>;

  const { kpi, charts } = data;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">Dashboard RH</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Total employés" value={kpi.total_employes} />
        <Kpi title="Contrats" value={kpi.contrats_actifs + kpi.contrats_expires} />
        <Kpi title="Congés" value={kpi.conges_en_attente + kpi.conges_en_cours + kpi.conges_refuses} />
        <Kpi title="Affectations" value={kpi.affectations_actives} />
        <Kpi title="Fonctions" value={charts.employes_par_fonction.length} />
        <Kpi title="Demandes" value={kpi.demandes_total} />
        <Kpi title="Montant achats" value={kpi.montant_achats} />
        <Kpi title="Montant paiements" value={kpi.montant_payements} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Employés par sexe">
          <PieChart>
            <Pie data={charts.employes_par_sexe} dataKey="total" nameKey="sexe" label />
            <Tooltip />
          </PieChart>
        </ChartCard>

        <ChartCard title="Employés par district">
          <BarChart data={charts.employes_par_district}>
            <XAxis dataKey="district__name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Employés par fonction">
          <BarChart data={charts.employes_par_fonction}>
            <XAxis dataKey="fonction__nom_fonction" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Paiements par mois">
          <LineChart data={charts.payements_par_mois.map((i:any)=>({ mois: dayjs(i.mois).format("MMM YYYY"), total: i.total || 0 }))}>
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Line dataKey="total" />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

/* =====================================================
   ================= DASHBOARD STOCK ===================
===================================================== */
const CHART_COLORS = ["#0ea5a4", "#06b6d4", "#f59e0b", "#ef4444", "#6366f1"];

function DashboardStock() {
  const [kpi, setKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    getDashboardStock().then(res => {
      setKpi(res.kpi);
      setStocks(res.stocks);
      setDemandesReappro(res.demandes_reappro);
      setDemandesAchat(res.demandes_achat);
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const pieMagasins = useMemo(() => {
    const map: any = {};
    stocks.forEach(s => {
      const key = s.magasin?.nom ?? "Inconnu";
      map[key] = (map[key] || 0) + s.quantite;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [stocks]);

  return (
    <div className="p-6 mt-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard Stock</h2>
        <button onClick={()=>setDark(v=>!v)} className="flex gap-2">{dark ? <Sun /> : <Moon />}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KPICard label="Articles" value={kpi.total_articles} icon={<Package />} />
        <KPICard label="Ruptures" value={kpi.articles_rupture} icon={<AlertTriangle />} />
        <KPICard label="Réappro" value={kpi.demandes_reappro_en_attente} icon={<Repeat />} />
        <KPICard label="Achats" value={kpi.demandes_achat_en_attente} icon={<ShoppingCart />} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Stocks par magasin</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieMagasins} dataKey="value" nameKey="name" label>
                {pieMagasins.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

/* =====================================================
   ================= COMPOSANTS ========================
===================================================== */
function Kpi({ title, value }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-bold">{value ?? 0}</CardContent>
    </Card>
  );
}

function KPICard({ label, value, icon }: any) {
  return (
    <Card className="p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xl font-bold">{value ?? 0}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Card>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-72"><ResponsiveContainer>{children}</ResponsiveContainer></CardContent>
    </Card>
  );
}
