// src/pages/finance/DecaissementsEnAttente.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_attente_coordonnateur: "En attente validation coordonnateur",
  approuve: "Approuvé",
  rejete: "Rejeté",
  decaisse: "Décaissement effectué",
};

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-gray-200 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-200 text-yellow-800",
  approuve: "bg-green-200 text-green-800",
  rejete: "bg-red-200 text-red-800",
  decaisse: "bg-blue-200 text-blue-800",
};

interface Decaissement {
  id: string;
  reference?: string;
  montant_total: number;
  statut: string;
  date_creation: string;
  date_decaissement?: string;
}

export default function DecaissementsEnAttente() {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      const filtered = (data.results || data).filter((d: Decaissement) => d.statut === "en_attente_coordonnateur");
      setDecaissements(filtered);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecaissements(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <Loader2 className="animate-spin w-8 h-8 mr-2" />Chargement...
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Décaissements en attente validation</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Référence</TableCell>
            <TableCell>Montant total</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Date création</TableCell>
            <TableCell>Date décaissement</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.length ? decaissements.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.reference || d.id}</TableCell>
              <TableCell>{Number(d.montant_total || 0).toLocaleString()} Ar</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-sm font-semibold ${STATUT_COLORS[d.statut] || "bg-gray-100 text-gray-700"}`}>
                  {STATUT_LABELS[d.statut] || d.statut}
                </span>
              </TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
              <TableCell>{d.date_decaissement ? new Date(d.date_decaissement).toLocaleString() : "-"}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">Aucun décaissement en attente</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
