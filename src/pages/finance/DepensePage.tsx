import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface Depense {
  id: string;
  numero: string;
  montant: number;
  description: string;
  statut: string;
  type_depense: { nom: string };
  date_creation: string;
}

export default function DepensePage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepenses = async () => {
    setLoading(true);
    try {
      const data: Depense[] = await financeApi.getDepenses();
      setDepenses(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors de la récupération des dépenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepenses();
  }, []);

  const handleMarquerPayee = async (id: string) => {
    try {
      await financeApi.validerDepense(id); // Appel de validation
      toast.success("Dépense marquée comme payée");
      fetchDepenses();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors de la validation");
    }
  };

  const handleAnnuler = async (id: string) => {
    try {
      await financeApi.rejeterDepense(id, "Annulée par le responsable");
      toast.success("Dépense annulée");
      fetchDepenses();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors de l'annulation");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dépenses</h1>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depenses.map((depense) => (
              <TableRow key={depense.id}>
                <TableCell>{depense.numero}</TableCell>
                <TableCell>{depense.type_depense.nom}</TableCell>
                <TableCell>{depense.montant.toLocaleString()} Ar</TableCell>
                <TableCell>{depense.description}</TableCell>
                <TableCell>{depense.statut}</TableCell>
                <TableCell>{new Date(depense.date_creation).toLocaleDateString()}</TableCell>
                <TableCell className="flex gap-2">
                  {depense.statut === "en_attente" && (
                    <>
                      <Button onClick={() => handleMarquerPayee(depense.id)} variant="success">
                        Marquer payée
                      </Button>
                      <Button onClick={() => handleAnnuler(depense.id)} variant="destructive">
                        Annuler
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
