// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface DemandeDecaissement {
  id: string;
  numero: string;
  montant: number;
  description: string;
  statut: string;
  created_at: string;
}

const DemandesDecaissement: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDecaissement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadDemandes = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDemandesDecaissement();
      setDemandes(data);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des demandes:", err);
      toast.error(err.message || "Erreur API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandes();
  }, []);

  const handleValider = async (id: string) => {
    try {
      await financeApi.validerDemandeDecaissement(id);
      toast.success("Demande validée !");
      loadDemandes();
    } catch (err: any) {
      toast.error(err.message || "Impossible de valider la demande");
    }
  };

  const handleRejeter = async (id: string) => {
    try {
      await financeApi.rejeterDemandeDecaissement(id, "Rejeté par finance");
      toast.success("Demande rejetée !");
      loadDemandes();
    } catch (err: any) {
      toast.error(err.message || "Impossible de rejeter la demande");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Demandes de Décaissement</h1>

      {loading ? (
        <p>Chargement des demandes...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((demande) => (
              <TableRow key={demande.id}>
                <TableCell>{demande.numero}</TableCell>
                <TableCell>{demande.montant.toLocaleString()} Ar</TableCell>
                <TableCell>{demande.description}</TableCell>
                <TableCell>{demande.statut}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    onClick={() => handleValider(demande.id)}
                    disabled={demande.statut !== "en_attente"}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejeter(demande.id)}
                    disabled={demande.statut !== "en_attente"}
                  >
                    Rejeter
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

// ✅ Export par défaut pour correspondre à l'import dans App.tsx
export default DemandesDecaissement;
