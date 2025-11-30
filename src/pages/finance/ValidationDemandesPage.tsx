import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

// Types
type ArticleDetail = { nom: string; quantite: number; prix_unitaire: number; statut?: string };
type DemandeDetail = {
  id: string;
  numero?: string;
  description?: string;
  montant: number;
  statut: string;
  source: "rh" | "stock";
  articles?: ArticleDetail[];
  paiements?: { montant: number; statut?: string }[];
};

// Badge couleur
const badgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approuve": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeStatus = (status?: string) => status?.toLowerCase().replace(/\s/g, "_") || "en_attente";

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
        paiements: [{ montant: Number(d.montant || 0), statut: normalizeStatus(d.status || d.statut) }],
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
        articles: d.article ? [{ nom: d.article.nom, quantite: d.quantite, prix_unitaire: d.montant_estime, statut: normalizeStatus(d.statut) }] : [],
      }));

      const all = [...rhDemandes, ...stockDemandes].filter(d => d.statut === "en_attente");
      setDemandes(all);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const handleApprove = async (d: DemandeDetail) => {
    try {
      if (d.source === "stock") await stockApi.validerDemandeAchat(d.id);
      else await rhApi.approveDemande(d.id);
      toast.success("Demande approuvée");
      fetchDemandes();
    } catch { toast.error("Erreur lors de l'approbation"); }
  };

  const handleReject = async (d: DemandeDetail) => {
    try {
      if (d.source === "stock") await stockApi.rejeterDemandeAchat(d.id, "Rejet via finance");
      else await rhApi.rejectDemande(d.id);
      toast.success("Demande rejetée");
      fetchDemandes();
    } catch { toast.error("Erreur lors du rejet"); }
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
            <TableRow key={d.id} className="bg-gray-50">
              <TableCell>{d.description}</TableCell>
              <TableCell>
                <span className={badgeColor(d.statut)}>{d.statut}</span>
              </TableCell>
              <TableCell>{formatMontant(d.montant)}</TableCell>
              <TableCell>
                {d.source === "stock" && d.articles?.map(a => (
                  <div key={a.nom}>
                    {a.nom} - {a.quantite} x {formatMontant(a.prix_unitaire)}{" "}
                    <span className={badgeColor(a.statut || "")}>{a.statut}</span>
                  </div>
                ))}
                {d.source === "rh" && d.paiements?.map((p, i) => (
                  <div key={i}>
                    {formatMontant(p.montant)} <span className={badgeColor(p.statut || "")}>{p.statut}</span>
                  </div>
                ))}
              </TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(d)}>Approuver</Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(d)}>Rejeter</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ValidationDemandesPage;
