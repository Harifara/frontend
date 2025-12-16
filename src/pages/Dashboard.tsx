import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { rhApi, stockApi } from "@/lib/api";

/* UI */
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* Charts */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

/* Icons */
import {
  Users,
  Package,
  AlertTriangle,
  Repeat,
  ShoppingCart,
} from "lucide-react";

/* ------------------ CONST ------------------ */
const COLORS = ["#0ea5a4", "#22c55e", "#eab308", "#ef4444", "#6366f1"];

/* ------------------ KPI CARD ------------------ */
const KPICard = ({ label, value, icon, color }: any) => (
  <Card className={`p-4 rounded-2xl shadow border ${color}`}>
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <div className="text-2xl font-bold">{value ?? 0}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  </Card>
);

/* ========================================================= */
/* ======================= DASHBOARD ======================= */
/* ========================================================= */
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === "admin";
  const isRH = role === "responsable_rh";
  const isStock = role === "responsable_stock";
  const isMagasinier = role === "magasinier";

  /* ======================= STATES ======================= */

  /* ---- RH ---- */
  const [rhKpi, setRhKpi] = useState<any>({});
  const [employes, setEmployes] = useState<any[]>([]);
  const [conges, setConges] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);

  /* ---- STOCK ---- */
  const [stockKpi, setStockKpi] = useState<any>({});
  const [stocks, setStocks] = useState<any[]>([]);
  const [demandesReappro, setDemandesReappro] = useState<any[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<any[]>([]);

  /* ======================= LOAD ======================= */
  useEffect(() => {
    if (isAdmin || isRH) loadDashboardRH();
    if (isAdmin || isStock || isMagasinier) loadDashboardStock();
  }, []);

  const loadDashboardRH = async () => {
    try {
      const res = await rhApi.getDashboardRH();
      setRhKpi(res.kpi ?? {});
      setEmployes(res.employers ?? []);
      setConges(res.conges ?? []);
      setContrats(res.contrats ?? []);
    } catch (e) {
      console.error("Erreur RH", e);
    }
  };

  const loadDashboardStock = async () => {
    try {
      const res = await stockApi.getDashboardStock();
      setStockKpi(res.kpi ?? {});
      setStocks(res.stocks ?? []);
      setDemandesReappro(res.demandes_reappro ?? []);
      setDemandesAchat(res.demandes_achat ?? []);
    } catch (e) {
      console.error("Erreur Stock", e);
    }
  };

  /* ======================= CHARTS ======================= */

  /* RH */
  const pieSexe = useMemo(() => {
    const map: any = {};
    employes.forEach(e => {
      const k = e.sexe || "Non renseigné";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [employes]);

  const barConges = useMemo(() => {
    const map: any = {};
    conges.forEach(c => {
      map[c.status_conge] = (map[c.status_conge] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [conges]);

  /* STOCK */
  const pieMagasins = useMemo(() => {
    const map: any = {};
    stocks.forEach(s => {
      const k = s.magasin?.nom || "Inconnu";
      map[k] = (map[k] || 0) + s.quantite;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [stocks]);

  /* ======================= RENDER ======================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex-1">
      <h1 className="text-3xl font-bold mb-6">
        Dashboard — {user?.full_name || user?.username}
      </h1>

      {/* ======================= KPI ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isAdmin || isRH) && (
          <>
            <KPICard label="Employés actifs" value={rhKpi.employes_actifs} icon={<Users />} color="bg-teal-50" />
            <KPICard label="Congés en attente" value={rhKpi.conges_en_attente} icon={<AlertTriangle />} color="bg-yellow-50" />
            <KPICard label="Contrats actifs" value={rhKpi.contrats_actifs} icon={<Repeat />} color="bg-green-50" />
          </>
        )}

        {(isAdmin || isStock || isMagasinier) && (
          <>
            <KPICard label="Articles en stock" value={stockKpi.total_articles} icon={<Package />} color="bg-blue-50" />
            <KPICard label="Ruptures" value={stockKpi.articles_rupture} icon={<AlertTriangle />} color="bg-red-50" />
            <KPICard label="Demandes d'achat" value={stockKpi.demandes_achat_en_attente} icon={<ShoppingCart />} color="bg-cyan-50" />
          </>
        )}
      </div>

      {/* ======================= CHARTS ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {(isAdmin || isRH) && (
          <Card className="p-4 rounded-2xl shadow border">
            <h3 className="font-semibold mb-3">Employés par sexe</h3>
            <div className="h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieSexe} dataKey="value" nameKey="name" label>
                    {pieSexe.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {(isAdmin || isRH) && (
          <Card className="p-4 rounded-2xl shadow border">
            <h3 className="font-semibold mb-3">Congés par statut</h3>
            <div className="h-[250px]">
              <ResponsiveContainer>
                <BarChart data={barConges}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5a4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {(isAdmin || isStock || isMagasinier) && (
          <Card className="p-4 rounded-2xl shadow border">
            <h3 className="font-semibold mb-3">Stocks par magasin</h3>
            <div className="h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieMagasins} dataKey="value" nameKey="name" label>
                    {pieMagasins.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* ======================= TABLES ======================= */}
      {(isAdmin || isRH) && (
        <Card className="p-4 rounded-2xl shadow border mb-6">
          <h3 className="font-semibold mb-3">Derniers congés</h3>
          <table className="w-full text-sm">
            <tbody>
              {conges.slice(0, 5).map((c, i) => (
                <tr key={i} className="border-b">
                  <td>{c.employer?.nom_employer}</td>
                  <td>{c.type_conge?.nom}</td>
                  <td>
                    <Badge variant={c.status_conge === "en_attente" ? "destructive" : "default"}>
                      {c.status_conge}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(isAdmin || isStock || isMagasinier) && (
        <Card className="p-4 rounded-2xl shadow border">
          <h3 className="font-semibold mb-3">Demandes d'achat</h3>
          <table className="w-full text-sm">
            <tbody>
              {demandesAchat.slice(0, 5).map((d, i) => (
                <tr key={i} className="border-b">
                  <td>{d.article?.nom}</td>
                  <td>{d.quantite}</td>
                  <td>
                    <Badge variant={d.statut === "en_attente" ? "destructive" : "default"}>
                      {d.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
