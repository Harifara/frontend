import React, { useEffect, useMemo, useState } from "react";
import { financeApi, rhApi, stockApi, coordinatorApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

type Source = "finance" | "rh" | "stock";

interface Item {
  id: string;
  description: string;
  montant: number;
  statut: string;
  source: Source;
  raw?: any;
  parent_decaissement_id?: string; // optional, if available
}

const normalizeRh = (d: any): Item => ({
  id: d.id,
  description: d.description || d.title || `Demande RH ${d.id}`,
  montant: Number(d.montant || d.montant_total || d.montant || 0),
  statut: (d.status || d.statut || "en_attente").toString(),
  source: "rh",
  raw: d,
});

const normalizeFinance = (f: any): Item => ({
  id: f.id,
  description: f.description || f.nom || `Item finance ${f.id}`,
  montant: Number(f.montant || f.total_montant || 0),
  statut: (f.statut || f.status || "en_attente").toString(),
  source: "finance",
  raw: f,
  parent_decaissement_id: f.decaissement || f.decaissement_id,
});

const normalizeStock = (s: any): Item => ({
  id: s.id,
  description:
    s.numero ||
    s.justification ||
    (s.article ? `${s.article.nom || s.article}` : `Demande Achat ${s.id}`),
  montant: Number(s.montant_estime || s.montant || 0),
  statut: (s.statut || s.statut_finance || "en_attente").toString(),
  source: "stock",
  raw: s,
});

const extractList = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.results && Array.isArray(response.results)) return response.results;
  return [];
};

const PAGE_SIZE = 20;

const DemandesDecaissement = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [detailsItem, setDetailsItem] = useState<Item | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  // Debounce search input to reduce re-renders / re-filter
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Prefer decaissements (which include items) when available
      const [financeItemsRes, financeDecaissementsRes, rhRes, stockRes] = await Promise.all([
        financeApi.getItems().catch((e: any) => {
          console.warn("financeApi.getItems failed", e);
          return [];
        }),
        financeApi.getDecaissements().catch((e: any) => {
          // non fatal; we'll still use items endpoint
          console.warn("financeApi.getDecaissements failed", e);
          return [];
        }),
        rhApi.getDemandes().catch((e: any) => {
          console.warn("rhApi.getDemandes failed", e);
          return [];
        }),
        stockApi.getDemandesAchat().catch((e: any) => {
          console.warn("stockApi.getDemandesAchat failed", e);
          return [];
        }),
      ]);

      // Build lists:
      const finItems = extractList(financeItemsRes).map(normalizeFinance);
      const decaissements = extractList(financeDecaissementsRes);
      // If decaissements provide items, prefer them (flatten)
      const finFromDecaissements: Item[] = [];
      if (Array.isArray(decaissements) && decaissements.length) {
        decaissements.forEach((d: any) => {
          if (Array.isArray(d.items) && d.items.length) {
            d.items.forEach((it: any) =>
              finFromDecaissements.push({
                ...normalizeFinance(it),
                parent_decaissement_id: d.id,
                raw: { item: it, decaissement: d },
              })
            );
          }
        });
      }

      const finList = finFromDecaissements.length ? finFromDecaissements : finItems;
      const rhList = extractList(rhRes).map(normalizeRh);
      const stockList = extractList(stockRes).map(normalizeStock);

      // Merge, dedupe by source+id (prefer decaissements items if duplicated)
      const mergedMap = new Map<string, Item>();
      [...finList, ...rhList, ...stockList].forEach((it) => {
        const key = `${it.source}:${it.id}`;
        if (!mergedMap.has(key)) mergedMap.set(key, it);
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => b.montant - a.montant);

      setItems(merged);
      setPage(1);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditModal = (item: Item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const openDetails = (item: Item) => {
    setDetailsItem(item);
  };

  // Unified update with safe fallbacks and handling comments on reject where supported
  const updateStatusWithOptionalComment = async (item: Item, statut: string, comment?: string) => {
    setActionLoadingId(item.id);
    try {
      // finance items: patch statut
      if (item.source === "finance") {
        // financeApi.updateItem expects (id, statut)
        await financeApi.updateItem(item.id, statut);
      } else if (item.source === "rh") {
        // prefer RH workflow endpoints
        if (statut.toLowerCase().includes("valid")) {
          if (typeof rhApi.approveDemande === "function") {
            await rhApi.approveDemande(item.id);
          } else {
            await rhApi.updateDemande(item.id, { status: "approuve" });
          }
        } else if (statut.toLowerCase().includes("rejet")) {
          // if RH endpoint accepts comment it's not in the rhApi helper; try multiple strategies
          try {
            // try passing comment if function supports it
            // @ts-ignore
            await rhApi.rejectDemande(item.id, comment);
          } catch {
            // fallback to no-comment reject or patch
            try {
              await rhApi.rejectDemande(item.id);
            } catch {
              await rhApi.updateDemande(item.id, { status: "rejete", commentaire: comment || "" });
            }
          }
        } else {
          // generic patch
          await rhApi.updateDemande(item.id, { status: statut }).catch(() => {});
        }
      } else if (item.source === "stock") {
        if (statut.toLowerCase().includes("valid")) {
          if (typeof stockApi.validerDemandeAchat === "function") {
            await stockApi.validerDemandeAchat(item.id);
          } else {
            await stockApi.updateDemandeAchat?.(item.id, { statut: "valide" });
          }
        } else if (statut.toLowerCase().includes("rejet")) {
          // stockApi.rejeterDemandeAchat accepts comment in our API wrapper
          try {
            await stockApi.rejeterDemandeAchat(item.id, comment || "");
          } catch {
            await stockApi.updateDemandeAchat?.(item.id, { statut: "rejete", commentaire: comment || "" });
          }
        } else {
          await stockApi.updateDemandeAchat?.(item.id, { statut }).catch(() => {});
        }
      }

      toast({ title: "Succès", description: `Statut mis à jour à "${statut}"` });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
      setIsModalOpen(false);
      setCommentModalOpen(false);
      setRejectionComment("");
    }
  };

  const handleUpdateStatut = async (statut: string) => {
    if (!editing) return;
    // some statuses require comment — open comment modal for rejets on stock
    if (statut.toLowerCase().includes("rejet")) {
      // open comment modal to collect optional comment
      setCommentModalOpen(true);
    } else {
      await updateStatusWithOptionalComment(editing, statut);
    }
  };

  const confirmRejectWithComment = async () => {
    if (!editing) return;
    await updateStatusWithOptionalComment(editing, "rejete", rejectionComment);
  };

  // Quick actions (approve/reject) without editing modal
  const quickApprove = async (item: Item) => {
    setEditing(item);
    await updateStatusWithOptionalComment(item, "valide");
  };
  const quickReject = async (item: Item) => {
    setEditing(item);
    // If source requires comment (stock) open modal, otherwise call directly
    if (item.source === "stock" || item.source === "rh") {
      setCommentModalOpen(true);
    } else {
      await updateStatusWithOptionalComment(item, "rejete");
    }
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((i) =>
      `${i.description} ${i.statut} ${i.source}`.toLowerCase().includes(debouncedSearch)
    );
  }, [items, debouncedSearch]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportPDF = async () => {
    const data = filtered.map((i) => [i.description, i.montant, i.statut, i.source]);
    const columns = ["Description", "Montant", "Statut", "Source"];
    await createPDFDoc("Demandes de Décaissement (Toutes sources)", data, columns, "demandes_decaissement_toutes_sources.pdf");
    toast({ title: "Export", description: "PDF exporté." });
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((i) => ({ Description: i.description, Montant: i.montant, Statut: i.statut, Source: i.source }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DemandesDecaissement");
    XLSX.writeFile(workbook, "demandes_decaissement_toutes_sources.xlsx");
    toast({ title: "Export", description: "Excel exporté." });
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandes de Décaissement (Toutes sources)</h1>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher (description / statut / source)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
        <Button onClick={fetchData} variant="ghost">Rafraîchir</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Source</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length ? pageItems.map((i) => (
                <TableRow key={`${i.source}-${i.id}`}>
                  <TableCell className="text-center">{i.description}</TableCell>
                  <TableCell className="text-center">{i.montant?.toLocaleString?.() ?? i.montant}</TableCell>
                  <TableCell className="text-center">{i.statut}</TableCell>
                  <TableCell className="text-center">{i.source}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openDetails(i)}>Voir détails</Button>
                    <Button size="sm" variant="outline" onClick={() => openEditModal(i)}>Modifier Statut</Button>

                    {/* Quick actions are disabled while an action is in-flight for this item */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => quickApprove(i)}
                      disabled={actionLoadingId === i.id}
                    >
                      {actionLoadingId === i.id ? "..." : "Valider"}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => quickReject(i)}
                      disabled={actionLoadingId === i.id}
                    >
                      {actionLoadingId === i.id ? "..." : "Rejeter"}
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun item trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* pagination controls */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-sm text-muted-foreground">
                {filtered.length} résultat(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Préc</Button>
              <span>Page {page}/{totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Suiv</Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ----------------- */}
      {/* Modal: Modifier statut */}
      {/* ----------------- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleUpdateStatut("en_attente")}>En attente</Button>
              <Button onClick={() => handleUpdateStatut("valide")}>Validé</Button>
              <Button onClick={() => handleUpdateStatut("rejete")} variant="destructive">Rejeté</Button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------- */}
      {/* Modal: Détails */}
      {/* ----------------- */}
      <Dialog open={!!detailsItem} onOpenChange={() => setDetailsItem(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Détails</DialogTitle>
          </DialogHeader>

          {detailsItem && (
            <div className="space-y-4">
              <div>
                <strong>Description:</strong> {detailsItem.description}
              </div>
              <div>
                <strong>Montant:</strong> {detailsItem.montant?.toLocaleString?.() ?? detailsItem.montant}
              </div>
              <div>
                <strong>Statut:</strong> {detailsItem.statut}
              </div>
              <div>
                <strong>Source:</strong> {detailsItem.source}
              </div>

              {/* Show raw payload for debugging / details */}
              <div className="max-h-48 overflow-auto bg-slate-50 p-3 rounded text-xs">
                <pre>{JSON.stringify(detailsItem.raw ?? detailsItem, null, 2)}</pre>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => { setEditing(detailsItem); setIsModalOpen(true); }}>Modifier statut</Button>
                <Button variant="outline" onClick={() => quickApprove(detailsItem)} disabled={actionLoadingId === detailsItem.id}>
                  {actionLoadingId === detailsItem.id ? "..." : "Valider"}
                </Button>
                <Button variant="destructive" onClick={() => quickReject(detailsItem)} disabled={actionLoadingId === detailsItem.id}>
                  {actionLoadingId === detailsItem.id ? "..." : "Rejeter"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setDetailsItem(null)} variant="outline">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------- */}
      {/* Modal: Rejet avec commentaire */}
      {/* ----------------- */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Rejet / Commentaire</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm">Veuillez indiquer un commentaire pour le rejet (conseillé pour traçabilité).</p>
            <Input
              placeholder="Commentaire de rejet (optionnel)"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={() => { setCommentModalOpen(false); setRejectionComment(""); }} variant="outline">Annuler</Button>
            <Button variant="destructive" onClick={confirmRejectWithComment} disabled={!editing || actionLoadingId === editing.id}>
              {actionLoadingId === (editing?.id ?? null) ? "..." : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DemandesDecaissement;