import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

type ArticleDetail = { nom: string; quantite: number; prix_unitaire: number };

type DemandeDetail = {
  id: string;
  numero?: string;
  description?: string;
  montant: number;
  statut: string;
  source: "rh" | "stock";
  articles?: ArticleDetail[];
  paiements?: number[];
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeStatus = (status?: string) =>
    status?.toLowerCase().replace(/\s/g, "_") || "en_attente";

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // RH
      const rhRes = await rhApi.getDemandes();
      const rhList = Array.isArray(rhRes.results) ? rhRes.results : rhRes || [];
      const rhDemandes: DemandeDetail[] = rhList.map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: normalizeStatus(d.status || d.statut),
        source: "rh",
        paiements: [Number(d.montant || 0)],
      }));

      // Stock
      const stockRes = await stockApi.getDemandesAchat();
      const stockList = Array.isArray(stockRes.results) ? stockRes.results : stockRes || [];
      const stockDemandes: DemandeDetail[] = stockList.map((d: any) => ({
        id: d.id,
        numero: d.numero,
        description: d.numero || d.description || "-",
        montant: Number(d.montant_estime || 0),
        statut: normalizeStatus(d.statut),
        source: "stock",
        articles: d.article ? [{ nom: d.article.nom, quantite: d.quantite, prix_unitaire: d.montant_estime }] : [],
      }));

      // Regrouper par demande principale (ici par id)
      const all = [...rhDemandes, ...stockDemandes].filter(d => d.statut === "en_attente");
      setDemandes(all);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleApprove = async (demande: DemandeDetail) => {
    try {
      if (demande.source === "stock") {
        await stockApi.validerDemandeAchat(demande.id);
      } else {
        await rhApi.approveDemande(demande.id);
      }
      toast.success("Demande approuvée avec succès");
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (demande: DemandeDetail) => {
    try {
      if (demande.source === "stock") {
        await stockApi.rejeterDemandeAchat(demande.id, "Rejet via finance");
      } else {
        await rhApi.rejectDemande(demande.id, "Rejet via finance");
      }
      toast.success("Demande rejetée avec succès");
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
      <h1 className="text-xl font-bold mb-4">Liste des Demandes</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Montant</TableCell>
            <TableCell>Détails</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map(d => (
            <React.Fragment key={d.id}>
              <TableRow className="bg-gray-100">
                <TableCell>{d.description}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{formatMontant(d.montant)}</TableCell>
                <TableCell>
                  {d.source === "stock" && d.articles?.map(a => (
                    <div key={a.nom}>
                      {a.nom} - {a.quantite} x {formatMontant(a.prix_unitaire)}
                    </div>
                  ))}
                  {d.source === "rh" && d.paiements?.map((p, i) => (
                    <div key={i}>{formatMontant(p)}</div>
                  ))}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(d)}>Approuver</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(d)}>Rejeter</Button>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDemandesPage;
