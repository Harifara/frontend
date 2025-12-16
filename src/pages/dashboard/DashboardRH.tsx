import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { rhApi } from "@/lib/api";
import dayjs from "dayjs";

export default function DashboardRH() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rhApi.get("/dashboard/rh/")
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const { kpi, charts } = data;

  return (
    <div className="p-6 space-y-8">
      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Total employés" value={kpi.total_employes} />
        <Kpi title="Contrats (total)" value={kpi.contrats_actifs + kpi.contrats_expires} />
        <Kpi title="Congés (total)" value={kpi.conges_en_attente + kpi.conges_en_cours + kpi.conges_refuses} />
        <Kpi title="Affectations actives" value={kpi.affectations_actives} />
        <Kpi title="Fonctions" value={charts.employes_par_fonction.length} />
        <Kpi title="Demandes (total)" value={kpi.demandes_total} />
        <Kpi title="Montant achats" value={kpi.montant_achats} />
        <Kpi title="Montant paiements" value={kpi.montant_payements} />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Homme / Femme */}
        <Card>
          <CardHeader><CardTitle>Employés par sexe</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={charts.employes_par_sexe} dataKey="total" nameKey="sexe" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employés par district */}
        <Card>
          <CardHeader><CardTitle>Employés par district</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={charts.employes_par_district}>
                <XAxis dataKey="district__name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employés par fonction */}
        <Card>
          <CardHeader><CardTitle>Employés par fonction</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={charts.employes_par_fonction}>
                <XAxis dataKey="fonction__nom_fonction" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Montant des paiements par mois */}
        <Card>
          <CardHeader><CardTitle>Montant des paiements par mois</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <LineChart data={charts.payements_par_mois.map(i => ({
                mois: dayjs(i.mois).format("MMM YYYY"),
                total: i.total || 0
              }))}>
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Line dataKey="total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-bold">
        {value ?? 0}
      </CardContent>
    </Card>
  );
}
