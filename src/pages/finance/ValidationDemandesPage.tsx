import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

type Demande = {
  id: string;
  numero?: string;
  description?: string;
  article?: string;
  quantite?: number;
  montant: number;
  statut: string;
  commentaire?: string;
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // RH Service
      const rhDemandesRaw = await rhApi.getDemandes();
      const rhDemandes: Demande[] = rhDemandesRaw
        .map((d: any) => ({
          id: d.id,
          description: d.description,
          montant: d.montant,
          statut: d.statut?.toLowerCase() || "en_attente",
        }))
        .filter(d => d.statut === "en_attente");

      // Stock Service
      const stockDemandesRaw = await stockApi.getDemandesAchat();
      const stockDemandes: Demande[] = stockDemandesRaw
        .map((d: any) => ({
          id: d.id,
          numero: d.article_id || d.id,
          article: d.article || "-",
          quantite: d.quantite,
          montant: Number(d.montant_estime || 0),
          statut: (d.statut_finance || "en_attente").toLowerCase(),
          commentaire: d.commentaire_finance || "",
        }))
        .filter(d => d.statut === "en_attente");

      setDemandes([...rhDemandes, ...stockDemandes]);
    } catch (error) {
      console.error("Erreur fetch demandes:", error);
      toast.error("Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (demande: Demande) => {
    try {
      if (demande.numero) {
        await stockApi.validerDemandeAchat(demande.id);
      } else {
        await rhApi.approveDemande(demande.id);
      }
      toast.success("Demande approuvée !");
      fetchDemandes();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (demande: Demande) => {
    try {
      if (demande.numero) {
        await stockApi.rejeterDemandeAchat(demande.id, demande.commentaire || "");
      } else {
        await rhApi.rejectDemande(demande.id);
      }
      toast.success("Demande rejetée !");
      fetchDemandes();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du rejet.");
    }
  };

  if (loading) return <div>Chargement des demandes...</div>;
  if (!demandes.length) return <div>Aucune demande à valider</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Validation des Demandes</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Numéro / Description</TableCell>
            <TableCell>Article</TableCell>
            <TableCell>Quantité</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Commentaire</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.numero || d.description}</TableCell>
              <TableCell>{d.article || "-"}</TableCell>
              <TableCell>{d.quantite ?? "-"}</TableCell>
              <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
              <TableCell>{d.commentaire || "-"}</TableCell>
              <TableCell className="space-x-2">
                <Button onClick={() => handleApprove(d)} variant="default" size="sm">
                  Approuver
                </Button>
                <Button onClick={() => handleReject(d)} variant="destructive" size="sm">
                  Rejeter
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDemandesPage;
