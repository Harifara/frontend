// src/pages/finance/ValidationDemandesPage.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi, financeApi } from "@/lib/api";

// -----------------
// Types
// -----------------
type ArticleDetail = { nom: string; quantite: number; prix_unitaire: number; statut?: string };
type PaiementDetail = { montant: number; statut?: string };

type DemandeDetail = {
  id: string;
  numero?: string;
  description?: string;
  montant: number;
  statut: string;
  source: "rh" | "stock";
  decaissement_cree?: boolean;
  articles?: ArticleDetail[];
  paiements?: PaiementDetail[];
};

// -----------------
// Badge couleur
// -----------------
const badgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approuve":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "decaisse":
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

// -----------------
// Composant
// -----------------
const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const normalizeStatus = (s?: string) => s?.toLowerCase().replace(/\s/g, "_") || "non_demande";
  const extractList = (res: any) => Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];

  // -----------------
  // Fetch
  // -----------------
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      // === RH ===
      const rhRes = await rhApi.getDemandes();
      const rhList = extractList(rhRes);
      const rhDemandes: DemandeDetail[] = rhList.map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: normalizeStatus(d.status),
        source: "rh",
        decaissement_cree: d.decaissement_cree || false,
        paiements: d.payements?.map((p: any) => ({
          montant: Number(p.montant || 0),
          statut: normalizeStatus(p.status),
        })) || [],
        articles: d.achats?.map((a: any) => ({
          nom: a.article,
          quantite: a.nombre,
          prix_unitaire: a.montant,
          statut: normalizeStatus(a.statut),
        })) || [],
      }));

      // === STOCK ===
      const stockRes = await stockApi.getDemandesAchat();
      const stockList = extractList(stockRes);
      const stockDemandes: DemandeDetail[] = stockList.map((d: any) => ({
        id: d.id,
        numero: d.numero,
        description: d.numero || d.description || "-",
        montant: Number(d.montant_estime || 0),
        statut: normalizeStatus(d.statut),
        source: "stock",
        decaissement_cree: d.decaissement_cree || false,
        articles: d.article ? [{
          nom: d.article.nom,
          quantite: d.quantite,
          prix_unitaire: d.montant_estime,
          statut: normalizeStatus(d.statut),
        }] : [],
        paiements: [],
      }));

      setDemandes([...rhDemandes, ...stockDemandes]);
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

  // -----------------
  // Actions
  // -----------------
  const handleApprove = async (d: DemandeDetail) => {
    try {
      if (d.source === "rh") await rhApi.approveDemande(d.id);
      else await stockApi.validerDemandeAchat(d.id);
      toast.success("Demande approuvée.");
      fetchDemandes();
    } catch {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (d: DemandeDetail) => {
    try {
      if (d.source === "rh") await rhApi.rejectDemande(d.id);
      else await stockApi.rejeterDemandeAchat(d.id, "Rejeté par finance");
      toast.success("Demande rejetée.");
      fetchDemandes();
    } catch {
      toast.error("Erreur lors du rejet.");
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const handleDecaisserSelection = async () => {
    if (!selected.size) return toast.error("Sélectionnez au moins une demande.");
    try {
      await financeApi.createDemandeDecaissement(Array.from(selected));
      toast.success("Décaissement créé !");
      setSelected(new Set());
      fetchDemandes();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du décaissement");
    }
  };

  // -----------------
  // Render
  // -----------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Validation des Demandes</h1>

      <Button
        className="mb-4"
        onClick={handleDecaisserSelection}
        disabled={selected.size === 0}
      >
        Créer demande de décaissement pour la sélection
      </Button>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sélection</TableHead>
              <TableHead>Description / Numéro</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    disabled={d.statut === "decaisse" || d.statut === "rejete" || d.decaissement_cree}
                    checked={selected.has(d.id)}
                    onChange={() => toggleSelect(d.id)}
                  />
                </TableCell>
                <TableCell>{d.description} {d.numero ? `(${d.numero})` : ""}</TableCell>
                <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                <TableCell>
                  {d.articles?.length ? (
                    <div className="mb-2">
                      <strong>Articles :</strong>
                      <ul className="ml-4 list-disc">
                        {d.articles.map((a, i) => (
                          <li key={i}>
                            {a.nom} — {a.quantite} × {a.prix_unitaire.toLocaleString()} Ar{" "}
                            <span className={badgeColor(a.statut || "")}>{a.statut}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {d.paiements?.length ? (
                    <div>
                      <strong>Paiements :</strong>
                      <ul className="ml-4 list-disc">
                        {d.paiements.map((p, i) => (
                          <li key={i}>
                            {p.montant.toLocaleString()} Ar{" "}
                            <span className={badgeColor(p.statut || "")}>{p.statut}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </TableCell>
                <TableCell><span className={badgeColor(d.statut)}>{d.statut}</span></TableCell>
                <TableCell className="space-x-2">
                  <Button onClick={() => handleApprove(d)} disabled={d.statut !== "en_attente"}>Approuver</Button>
                  <Button variant="destructive" onClick={() => handleReject(d)} disabled={d.statut !== "en_attente"}>Rejeter</Button>
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
