import React, { useEffect, useMemo, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
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
  parent_decaissement_id?: string;
}

const normalizeRh = (d: any): Item => ({
  id: d.id,
  description: d.description || d.title || `Demande RH ${d.id}`,
  montant: Number(d.montant || d.montant_total || 0),
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

const DemandesDecaissement: React.FC = () => {
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [financeItemsRes, financeDecaissementsRes, rhRes, stockRes] = await Promise.all([
        financeApi.getItems().catch(() => []),
        financeApi.getDecaissements().catch(() => []),
        rhApi.getDemandes().catch(() => []),
        stockApi.getDemandesAchat().catch(() => []),
      ]);

      const finItems = extractList(financeItemsRes).map(normalizeFinance);
      const decaissements = extractList(financeDecaissementsRes);
      const finFromDecaissements: Item[] = [];

      decaissements.forEach((d: any) => {
        if (Array.isArray(d.items)) {
          d.items.forEach((it: any) =>
            finFromDecaissements.push({
              ...normalizeFinance(it),
              parent_decaissement_id: d.id,
              raw: { item: it, decaissement: d },
            })
          );
        }
      });

      const finList = finFromDecaissements.length ? finFromDecaissements : finItems;
      const rhList = extractList(rhRes).map(normalizeRh);
      const stockList = extractList(stockRes).map(normalizeStock);

      // Merge and dedupe by source+id
      const mergedMap = new Map<string, Item>();
      [...finList, ...rhList, ...stockList].forEach((it) => {
        const key = `${it.source}:${it.id}`;
        if (!mergedMap.has(key)) mergedMap.set(key, it);
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.montant - a.montant);

      setItems(merged);
      setPage(1);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (item: Item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const openDetails = (item: Item) => setDetailsItem(item);

  const updateStatusWithOptionalComment = async (item: Item, statut: string, comment?: string) => {
    setActionLoadingId(item.id);
    try {
      if (item.source === "finance") {
        await financeApi.updateItem(item.id, statut);
      } else if (item.source === "rh") {
        if (statut.toLowerCase().includes("valid")) {
          await (rhApi.approveDemande?.(item.id) ?? rhApi.updateDemande(item.id, { status: "approuve" }));
        } else if (statut.toLowerCase().includes("rejet")) {
          await (rhApi.rejectDemande?.(item.id, comment) ?? rhApi.updateDemande(item.id, { status: "rejete", commentaire: comment || "" }));
        } else {
          await rhApi.updateDemande(item.id, { status: statut }).catch(() => {});
        }
      } else if (item.source === "stock") {
        if (statut.toLowerCase().includes("valid")) {
          await (stockApi.validerDemandeAchat?.(item.id) ?? stockApi.updateDemandeAchat?.(item.id, { statut: "valide" }));
        } else if (statut.toLowerCase().includes("rejet")) {
          await (stockApi.rejeterDemandeAchat?.(item.id, comment || "") ?? stockApi.updateDemandeAchat?.(item.id, { statut: "rejete", commentaire: comment || "" }));
        } else {
          await stockApi.updateDemandeAchat?.(item.id, { statut }).catch(() => {});
        }
      }

      toast({ title: "Succès", description: `Statut mis à jour à "${statut}"` });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
      setIsModalOpen(false);
      setCommentModalOpen(false);
      setRejectionComment("");
    }
  };

  const handleUpdateStatut = async (statut: string) => {
    if (!editing) return;
    if (statut.toLowerCase().includes("rejet")) {
      setCommentModalOpen(true);
    } else {
      await updateStatusWithOptionalComment(editing, statut);
    }
  };

  const confirmRejectWithComment = async () => {
    if (!editing) return;
    await updateStatusWithOptionalComment(editing, "rejete", rejectionComment);
  };

  const quickApprove = async (item: Item) => {
    setEditing(item);
    await updateStatusWithOptionalComment(item, "valide");
  };

  const quickReject = async (item: Item) => {
    setEditing(item);
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
      {/* ... reste du rendu identique au code initial, avec pagination et modals ... */}
    </div>
  );
};

export default DemandesDecaissement;
