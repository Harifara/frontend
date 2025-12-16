// src/pages/coordonnateur/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { cordoApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { ListChecks, FileText, CheckCircle, XCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_BADGES: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-100 text-yellow-800",
  valide: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
};

export default function DashboardCoordonnateur() {
  const [kpi, setKpi] = useState<any>({
    total: 0,
    approuve: 0,
    rejete: 0,
    en_attente: 0
  });
  const [decaissements, setDecaissements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await cordoApi.getDashboard();

      // 🔹 Adapter les champs KPI pour le front
      setKpi({
        total: data.kpi.total_validations,
        approuve: data.kpi.approuvees,
        rejete: data.kpi.rejetees,
        en_attente: data.kpi.en_attente,
      });

      // 🔹 Décaissements en attente
      setDecaissements(data.decaissements_en_attente || []);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger le dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />Chargement du dashboard...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Coordonnateur</h1>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <KPICard icon={ListChecks} label="Décaissements en attente" value={kpi.en_attente} />
        <KPICard icon={CheckCircle} label="Décaissements approuvés" value={kpi.approuve} />
        <KPICard icon={XCircle} label="Décaissements rejetés" value={kpi.rejete} />
        <KPICard icon={FileText} label="Total décaissements" value={kpi.total} />
      </div>

      {/* Décaissements en attente */}
      <Card>
        <CardHeader>
          <CardTitle>Décaissements en attente validation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decaissements.length ? (
                decaissements.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.reference || d.id}</TableCell>
                    <TableCell>{Number(d.montant_total || 0).toLocaleString()} Ar</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.statut === "valide"
                          ? "Validé"
                          : d.statut === "rejete"
                          ? "Rejeté"
                          : "En attente"}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() =>
                          toast({
                            title: "Info",
                            description: "Validation à implémenter",
                          })
                        }
                      >
                        Valider / Rejeter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Aucun décaissement en attente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
