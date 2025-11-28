import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

type Article = {
  id: string;
  code?: string;
  nom?: string;
  description?: string;
  unite_mesure?: string;
  prix_unitaire_estime?: number;
  is_active?: boolean;
  categorie?: string;
  created_at?: string;
  updated_at?: string;
};

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

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // RH Service
      const rhResp = await rhApi.get("/demandes/");
      const rhDemandes: Demande[] = (rhResp.data?.results || []).map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: (d.status || "").toLowerCase(),
      }));

      // Stock Service
      const stockResp = await stockApi.get("/demandes-achat/");
      const stockDemandes: Demande[] = (stockResp.data || []).map((d: any) => ({
        id: d.id || d.Numero,
        numero: d.Numero,
        article: d.Article || null,
        quantite: d.Quantite ?? 0,
        montant: Number(d["Montant Estimé"] || 0),
        statut: (d["Statut Finance"] || "en_attente").toLowerCase(),
        commentaire: d["Commentaire Finance"] || "",
      }));

      // Fusionner toutes les demandes et ne garder que celles en attente
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
        await stockApi.post(`/demandes-achat/${demande.id}/approve/`);
      } else {
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

  const formatMontant = (montant: number) => montant?.toLocaleString() + " Ar";

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
              <TableCell>
                {d.article ? d.article.nom || d.article.description || "-" : "-"}
              </TableCell>
              <TableCell>{d.quantite ?? "-"}</TableCell>
              <TableCell>{formatMontant(d.montant)}</TableCell>
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
