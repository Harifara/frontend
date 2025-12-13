// src/pages/finance/DecaissementsEnAttente.tsx
import React, { useEffect, useState } from "react";
import { financeApi, cordoApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // 🔹 Fonction pour récupérer les décaissements
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      // Filtrer uniquement ceux encore en attente
      setDecaissements((data.results || data).filter((d: Decaissement) => d.statut === "en_attente_coordonnateur"));
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les décaissements.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecaissements();

    // Optionnel : refresh toutes les 10 sec pour suivre les statuts
    const interval = setInterval(fetchDecaissements, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Validation ou rejet d'un décaissement
  const handleDecision = async (id: string, decision: "approuve" | "rejete") => {
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      const payload = { demande_decaissement_id: id, decision, commentaire: "" };
      const response = await cordoApi.createValidation(payload);

      toast({
        title: "Succès",
        description: `Décaissement ${decision === "approuve" ? "approuvé" : "rejeté"}`
      });

      // 🔹 Mettre à jour le statut localement si Finance retourne l'objet mis à jour
      if (response?.validation) {
        setDecaissements(prev =>
          prev.map(d => (d.id === id ? { ...d, statut: response.validation.decision } : d))
        );
      } else {
        // Retirer de la liste si pas de retour
        setDecaissements(prev => prev.filter(d => d.id !== id));
      }
    } catch (err: any) {
      console.error("Erreur lors de la validation :", err);
      toast({
        title: "Erreur",
        description: err?.response?.data?.detail || err?.message || "Action échouée",
        variant: "destructive"
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-8 h-8 mr-2" /> Chargement...
      </div>
    );
  }

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
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.length ? decaissements.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.reference || d.id}</TableCell>
              <TableCell>{Number(d.montant_total || 0).toFixed(2)} Ar</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-sm font-semibold ${STATUT_COLORS[d.statut] || "bg-gray-100 text-gray-700"}`}>
                  {STATUT_LABELS[d.statut] || d.statut}
                </span>
              </TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
              <TableCell>{d.date_decaissement ? new Date(d.date_decaissement).toLocaleString() : "-"}</TableCell>
              <TableCell className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleDecision(d.id, "approuve")}
                  disabled={submitting[d.id]}
                >
                  {submitting[d.id] ? "..." : "Approuver"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDecision(d.id, "rejete")}
                  disabled={submitting[d.id]}
                >
                  {submitting[d.id] ? "..." : "Rejeter"}
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                Aucun décaissement en attente
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
