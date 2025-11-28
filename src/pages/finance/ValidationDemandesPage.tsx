import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/api";

type Demande = {
  id: string;
  numero: string;
  type_demande: "rh" | "achat_stock";
  description: string;
  montant: number;
  statut: string;
  commentaire_validation?: string;
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getValidations();
      const list = data.results || data;

      const enAttente = list.filter((d: any) => d.statut === "en_attente");

      setDemandes(enAttente);
    } catch (err) {
      console.error("Erreur fetch validations:", err);
      toast.error("Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleApprove = async (demande: Demande) => {
    try {
      await financeApi.approuver(demande.id);
      toast.success("Demande approuvée !");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (demande: Demande) => {
    try {
      await financeApi.rejeter(demande.id, "Rejet via page Finance");
      toast.success("Demande rejetée !");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du rejet.");
    }
  };

  const formatMontant = (m: number) => m.toLocaleString() + " Ar";

  if (loading) return <div>Chargement...</div>;
  if (!demandes.length) return <div>Aucune demande en attente</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Validation des Demandes</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Numéro</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.numero}</TableCell>
              <TableCell>{d.description}</TableCell>
              <TableCell>{formatMontant(d.montant)}</TableCell>
              <TableCell className="space-x-2">
                <Button onClick={() => handleApprove(d)}>Approuver</Button>
                <Button variant="destructive" onClick={() => handleReject(d)}>Rejeter</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDemandesPage;
