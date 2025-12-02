// src/pages/finance/ValidationDemandesPage.tsx
import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { rhApi, stockApi, financeApi } from "@/lib/api";

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
  articles?: ArticleDetail[];
  paiements?: PaiementDetail[];
};

// -----------------
// Badge couleur
// -----------------
const badgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approuve": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "decaisse": return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

// -----------------
// Composant
// -----------------
const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<{ selectedIds: string[] }>({ selectedIds: [] });
  const { toast } = useToast();

  const normalizeStatus = (s?: string) => s?.toLowerCase().replace(/\s/g, "_") || "en_attente";
  const extractList = (res: any) => Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];

  // -----------------
  // Fetch demandes
  // -----------------
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const rhRes = await rhApi.getDemandes();
      const rhList = extractList(rhRes).map((d: any) => ({
        id: d.id,
        description: d.description,
        montant: Number(d.montant || 0),
        statut: normalizeStatus(d.status),
        source: "rh",
        paiements: d.payements?.map((p: any) => ({ montant: Number(p.montant || 0), statut: normalizeStatus(p.status) })) || [],
        articles: d.achats?.map((a: any) => ({ nom: a.article, quantite: a.nombre, prix_unitaire: a.montant, statut: normalizeStatus(a.statut) })) || [],
      }));

      const stockRes = await stockApi.getDemandesAchat();
      const stockList = extractList(stockRes).map((d: any) => ({
        id: d.id,
        numero: d.numero,
        description: d.numero || d.description || "-",
        montant: Number(d.montant_estime || 0),
        statut: normalizeStatus(d.statut),
        source: "stock",
        articles: d.article ? [{ nom: d.article.nom, quantite: d.quantite, prix_unitaire: d.montant_estime, statut: normalizeStatus(d.statut) }] : [],
        paiements: [],
      }));

      setDemandes([...rhList, ...stockList]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  // -----------------
  // Actions
  // -----------------
  const handleApprove = async (d: DemandeDetail) => {
    try {
      if (d.source === "rh") await rhApi.approveDemande(d.id);
      else await stockApi.validerDemandeAchat(d.id);
      toast({ title: "Succès", description: "Demande approuvée." });
      fetchDemandes();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (d: DemandeDetail) => {
    try {
      if (d.source === "rh") await rhApi.rejectDemande(d.id);
      else await stockApi.rejeterDemandeAchat(d.id, "Rejeté par finance");
      toast({ title: "Succès", description: "Demande refusée." });
      fetchDemandes();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.selectedIds.length) return toast({ title: "Erreur", description: "Sélectionnez au moins une demande.", variant: "destructive" });

    try {
      await financeApi.createDemandeDecaissement(form.selectedIds);
      toast({ title: "Succès", description: "Demande de décaissement créée." });
      setIsModalOpen(false);
      setForm({ selectedIds: [] });
      fetchDemandes();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Validation des Demandes</h1>
        <Button onClick={() => setIsModalOpen(true)}>Créer demande de décaissement</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description / Numéro</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Détails</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {demandes.map(d => (
            <TableRow key={d.id}>
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

      {/* -------------------- */}
      {/* Modal Création Décaissement */}
      {/* -------------------- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une demande de décaissement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="font-medium">Sélectionner les demandes approuvées</label>
            <MultiSelect
              items={demandes
                .filter(d => d.statut === "approuve")
                .map(d => ({ value: d.id, label: `${d.description} (${d.montant.toLocaleString()} Ar)` }))
              }
              selected={form.selectedIds}
              onChange={(values) => setForm({ selectedIds: values })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidationDemandesPage;
