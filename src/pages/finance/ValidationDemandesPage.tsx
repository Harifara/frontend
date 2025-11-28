import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { stockApi, rhApi } from "@/lib/api"; // tes APIs configurées
import { toast } from "react-hot-toast";

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
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // RH Service
      const rhResp = await rhApi.get("/demandes/");
      const rhDemandes: Demande[] = (rhResp.data.results || []).map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: d.montant,
        statut: d.status.toLowerCase(),
      }));

      // Stock Service
      const stockResp = await stockApi.get("/demandes-achat/");
      const stockDemandes: Demande[] = (stockResp.data || []).map((d: any) => ({
        id: d.id || d.Numero,
        numero: d.Numero,
        article: d.Article,
        quantite: d.Quantite,
        montant: Number(d["Montant Estimé"] || 0),
        statut: d["Statut Finance"]?.toLowerCase() || "en_attente",
        commentaire: d["Commentaire Finance"] || "",
      }));

      // Fusionner toutes les demandes
      const allDemandes = [...rhDemandes, ...stockDemandes].filter(d => d.statut === "en_attente");
      setDemandes(allDemandes);
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
        // Stock service
        await stockApi.post(`/demandes-achat/${demande.id}/approve/`);
      } else {
        // RH service
        await rhApi.post(`/demandes/${demande.id}/approve/`);
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
        await stockApi.post(`/demandes-achat/${demande.id}/reject/`);
      } else {
        await rhApi.post(`/demandes/${demande.id}/reject/`);
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
              <TableCell>{d.quantite || "-"}</TableCell>
              <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
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
