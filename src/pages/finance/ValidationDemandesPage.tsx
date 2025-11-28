import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

type Article = { id: string; nom?: string; description?: string };

type Demande = {
  id: string;
  numero?: string;
  description?: string;
  article?: Article | null;
  quantite?: number;
  montant: number;
  statut: string;
  commentaire?: string;
  source: "rh" | "stock";
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // -------------------------------
      // 📌 1. Demandes RH
      // -------------------------------
      const rhRes = await rhApi.getDemandes();
      const rhList = rhRes.results || rhRes || [];

      const rhDemandes: Demande[] = rhList.map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: (d.status || "").toLowerCase(),
        source: "rh",
      }));

      // -------------------------------
      // 📌 2. Demandes Stock
      // -------------------------------
      const stockRes = await stockApi.getDemandesAchat();
      const stockList = stockRes.results || stockRes || [];

      const stockDemandes: Demande[] = stockList.map((d: any) => ({
        id: d.id,
        numero: d.numero,
        article: d.article,
        quantite: d.quantite,
        montant: Number(d.montant_estime || 0),
        statut: (d.statut || "en_attente").toLowerCase(),
        commentaire: d.commentaire_finance || "",
        source: "stock",
      }));

      // Fusion + filtrage
      const all = [...rhDemandes, ...stockDemandes].filter(
        d => d.statut === "en_attente"
      );

      setDemandes(all);

    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // -------------------------------
  // 📌 Validation
  // -------------------------------
  const handleApprove = async (demande: Demande) => {
    try {
      if (demande.source === "stock") {
        await stockApi.validerDemandeAchat(demande.id);
      } else {
        await rhApi.approveDemande(demande.id);
      }
      toast.success("Demande approuvée");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur");
    }
  };

  // -------------------------------
  // 📌 Rejet
  // -------------------------------
  const handleReject = async (demande: Demande) => {
    try {
      if (demande.source === "stock") {
        await stockApi.rejeterDemandeAchat(demande.id, "Rejet via finance");
      } else {
        await rhApi.rejectDemande(demande.id, "Rejet via finance");
      }
      toast.success("Demande rejetée");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du rejet");
    }
  };

  const formatMontant = (m: number) => `${m.toLocaleString()} Ar`;

  if (loading) return <div>Chargement...</div>;
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
            <TableCell>Service</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.numero || d.description}</TableCell>
              <TableCell>{d.article?.nom || "-"}</TableCell>
              <TableCell>{d.quantite ?? "-"}</TableCell>
              <TableCell>{formatMontant(d.montant)}</TableCell>
              <TableCell>{d.commentaire || "-"}</TableCell>
              <TableCell>
                {d.source === "stock" ? "Stock" : "Ressources Humaines"}
              </TableCell>

              <TableCell className="space-x-2">
                <Button size="sm" onClick={() => handleApprove(d)}>
                  Approuver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(d)}>
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
