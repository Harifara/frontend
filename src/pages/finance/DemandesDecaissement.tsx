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
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.data)) return response.data;
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

      console.log("Merged items:", merged);

      setItems(merged);
      setPage(1);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((i) =>
      `${i.description} ${i.statut} ${i.source}`.toLowerCase().includes(debouncedSearch)
    );
  }, [items, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <Input
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((item) => (
            <TableRow key={`${item.source}:${item.id}`}>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.montant}</TableCell>
              <TableCell>{item.statut}</TableCell>
              <TableCell>{item.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
          Précédent
        </Button>
        <span>
          Page {page} / {totalPages}
        </span>
        <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          Suivant
        </Button>
      </div>
    </div>
  );
};

export default DemandesDecaissement;
