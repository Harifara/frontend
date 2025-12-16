import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0ea5a4", "#22c55e", "#eab308", "#ef4444", "#6366f1"];

/* -------------------- KPI CARD -------------------- */
const KPICard = ({ label, value, color }: any) => (
  <Card className={`p-4 rounded-2xl shadow border ${color}`}>
    <div className="text-2xl font-bold">{value ?? 0}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </Card>
);

/* ==================== DASHBOARD RH ==================== */
export default function DashboardRH() {
  const [kpi, setKpi] = useState<any>({});
  const [employers, setEmployers] = useState<any[]>([]);
  const [conges, setConges] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);
  const [affectations, setAffectations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await rhApi.getDashboardRH();
      setKpi(res.kpi ?? {});
      setEmployers(res.employers ?? []);
      setConges(res.conges ?? []);
      setContrats(res.contrats ?? []);
      setAffectations(res.affectations ?? []);
    } catch (error) {
      console.error("Erreur dashboard RH", error);
    }
  };

  /* -------------------- CHART DATA -------------------- */

  // Répartition employés par sexe
  const pieSexe = employers.reduce((acc: any[], e) => {
    const idx = acc.findIndex(a => a.name === e.sexe);
    if (idx >= 0) acc[idx].value += 1;
    else acc.push({ name: e.sexe ?? "N/A", value: 1 });
    return acc;
  }, []);

  // Congés par statut
  const barConges = conges.reduce((acc: any, c) => {
    acc[c.status_conge] = (acc[c.status_conge] || 0) + 1;
    return acc;
  }, {});
  const barCongesData = Object.entries(barConges).map(([name, value]) => ({ name, value }));

  // Contrats par statut
  const pieContrats = contrats.reduce((acc: any[], c) => {
    const idx = acc.findIndex(a => a.name === c.status_contrat);
    if (idx >= 0) acc[idx].value += 1;
    else acc.push({ name: c.status_contrat, value: 1 });
    return acc;
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex-1">
      <h1 className="text-3xl font-bold mb-6">Dashboard RH</h1>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard label="Employés actifs" value={kpi.employes_actifs} color="bg-teal-50" />
        <KPICard label="Congés en attente" value={kpi.conges_en_attente} color="bg-yellow-50" />
        <KPICard label="Contrats actifs" value={kpi.contrats_actifs} color="bg-green-50" />
        <KPICard label="Affectations actives" value={kpi.affectations_actives} color="bg-blue-50" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sexe */}
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

        {/* Congés */}
        <Card className="p-4 rounded-2xl shadow border">
          <h3 className="font-semibold mb-3">Congés par statut</h3>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <BarChart data={barCongesData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Contrats */}
        <Card className="p-4 rounded-2xl shadow border">
          <h3 className="font-semibold mb-3">Contrats par statut</h3>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieContrats} dataKey="value" nameKey="name" label>
                  {pieContrats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* LISTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Congés récents */}
        <Card className="p-4 rounded-2xl shadow border">
          <h3 className="font-semibold mb-3">Derniers congés</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Employé</th>
                <th>Type</th>
                <th>Statut</th>
              </tr>
            </thead>
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

        {/* Affectations */}
        <Card className="p-4 rounded-2xl shadow border">
          <h3 className="font-semibold mb-3">Affectations récentes</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Employé</th>
                <th>Nouvelle fonction</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {affectations.slice(0, 5).map((a, i) => (
                <tr key={i} className="border-b">
                  <td>{a.employer?.nom_employer}</td>
                  <td>{a.nouveau_fonction?.nom_fonction}</td>
                  <td>
                    <Badge>{a.status_affectation}</Badge>
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
