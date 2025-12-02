import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi } from "@/lib/api";

// Types
type ArticleDetail = { nom: string; quantite: number; prix_unitaire: number; statut?: string };
type PaiementDetail = { montant: number; statut?: string };
type DemandeDetail = {
  id: string;
  numero?: string;
  description?: string;
  montant: number;
  statut: string;
  source: "rh" | "stock";
  articles?: ArticleDetail[];
  paiements?: PaiementDetail[];
};

// Badge couleur
const badgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approuve":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeStatus = (s?: string) =>
    s?.toLowerCase().replace(/\s/g, "_") || "en_attente";

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // ---- RH ----
      const rhRes = await rhApi.getDemandes();
      const rhList = Array.isArray(rhRes.results) ? rhRes.results : rhRes || [];

      const rhDemandes: DemandeDetail[] = rhList.map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: normalizeStatus(d.status),
        source: "rh",
        paiements: d.payements?.map((p: any) => ({
          montant: p.montant,
          statut: normalizeStatus(p.status),
        })) || [],
        articles: d.achats?.map((a: any) => ({
          nom: a.article,
          quantite: a.nombre,
          prix_unitaire: a.montant,
          statut: normalizeStatus(a.statut),
        })) || [],
      }));

      // ---- STOCK ----
      const stockRes = await stockApi.getDemandesAchat();
      const stockList = Array.isArray(stockRes.results) ? stockRes.results : stockRes || [];

      const stockDemandes: DemandeDetail[] = stockList.map((d: any) => ({
        id: d.id,
        numero: d.numero,
        description: d.numero || d.description || "-",
        montant: Number(d.montant_estime || 0),
        statut: normalizeStatus(d.statut),
        source: "stock",
        articles: d.article
          ? [
              {
                nom: d.article.nom,
                quantite: d.quantite,
                prix_unitaire: d.montant_estime,
                statut: normalizeStatus(d.statut),
              },
            ]
          : [],
        paiements: [],
      }));

      const all = [...rhDemandes, ...stockDemandes].filter(
        (d) => d.statut === "en_attente"
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

  const handleApprove = async (demande: DemandeDetail) => {
    try {
      if (demande.source === "rh") {
        await rhApi.approveDemande(demande.id);
      } else {
        await stockApi.validerDemandeAchat(demande.id);
      }
      toast.success("Demande approuvée.");
      fetchDemandes();
    } catch (err) {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (demande: DemandeDetail) => {
    try {
      if (demande.source === "rh") {
        await rhApi.rejectDemande(demande.id);
      } else {
        await stockApi.rejeterDemandeAchat(demande.id, "Rejeté par finance");
      }
      toast.success("Demande rejetée.");
      fetchDemandes();
    } catch (err) {
      toast.error("Erreur lors du rejet.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Validation des Demandes</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Description / Numéro</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Détails</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {d.description} {d.numero ? `(${d.numero})` : ""}
                </TableCell>

                <TableCell>{d.montant.toLocaleString()} Ar</TableCell>

                {/* 🔥 DÉTAILS (Achats / Articles / Paiements) */}
                <TableCell>
                  {/* Articles / Achats */}
                  {d.articles && d.articles.length > 0 && (
                    <div className="mb-2">
                      <strong>Articles :</strong>
                      <ul className="ml-4 list-disc">
                        {d.articles.map((a, i) => (
                          <li key={i}>
                            {a.nom} — {a.quantite} × {a.prix_unitaire.toLocaleString()} Ar
                            <span className={badgeColor(a.statut || "")}>
                              {a.statut}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Paiements */}
                  {d.paiements && d.paiements.length > 0 && (
                    <div>
                      <strong>Paiements :</strong>
                      <ul className="ml-4 list-disc">
                        {d.paiements.map((p, i) => (
                          <li key={i}>
                            {p.montant.toLocaleString()} Ar
                            <span className={badgeColor(p.statut || "")}>
                              {p.statut}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <span className={badgeColor(d.statut)}>{d.statut}</span>
                </TableCell>

                <TableCell className="space-x-2">
                  <Button onClick={() => handleApprove(d)}>Approuver</Button>
                  <Button variant="destructive" onClick={() => handleReject(d)}>
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

export default ValidationDemandesPage;
