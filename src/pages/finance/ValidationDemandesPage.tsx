import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi, financeApi } from "@/lib/api";

type Article = { id: string; nom?: string; description?: string; };

type Demande = {
  id: string;
  numero?: string;
  description?: string;
  article?: Article | null;
  quantite?: number;
  montant: number;
  statut: string;
  commentaire?: string;
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // RH
      const rhData = await rhApi.getDemandes();
      const rhDemandes: Demande[] = (rhData.results || rhData || []).map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: (d.status || "").toLowerCase(),
      }));

      // Stock
      const stockData = await stockApi.getDemandesAchat();
      const stockDemandes: Demande[] = (stockData.results || stockData || []).map((d: any) => ({
        id: d.id || d.numero,
        numero: d.numero,
        article: d.article || null,
        quantite: d.quantite ?? 0,
        montant: Number(d.montant_estime || 0),
        statut: (d.statut || "en_attente").toLowerCase(),
        commentaire: d.commentaire_finance || "",
      }));

      // Fusion et filtrage
      const allDemandes = [...rhDemandes, ...stockDemandes].filter(d => d.statut === "en_attente");
      setDemandes(allDemandes);

    } catch (err) {
      console.error("Erreur fetch demandes:", err);
      toast.error("Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const handleApprove = async (demande: Demande) => {
    try {
      if (demande.numero) await stockApi.validerDemandeAchat(demande.id);
      else await rhApi.approveDemande(demande.id);
      toast.success("Demande approuvée !");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (demande: Demande) => {
    try {
      if (demande.numero) await stockApi.rejeterDemandeAchat(demande.id, "Rejet via page");
      else await rhApi.rejectDemande(demande.id, "Rejet via page");
      toast.success("Demande rejetée !");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du rejet.");
    }
  };

  const formatMontant = (montant: number) => montant.toLocaleString() + " Ar";

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
          {demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.numero || d.description}</TableCell>
              <TableCell>{d.article ? d.article.nom || d.article.description || "-" : "-"}</TableCell>
              <TableCell>{d.quantite ?? "-"}</TableCell>
              <TableCell>{formatMontant(d.montant)}</TableCell>
              <TableCell>{d.commentaire || "-"}</TableCell>
              <TableCell className="space-x-2">
                <Button onClick={() => handleApprove(d)} variant="default" size="sm">Approuver</Button>
                <Button onClick={() => handleReject(d)} variant="destructive" size="sm">Rejeter</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDemandesPage;
