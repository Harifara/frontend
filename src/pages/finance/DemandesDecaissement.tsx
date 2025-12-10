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

interface ItemForm {
  description: string;
  montant: number;
}

const PAGE_SIZE = 20;

const DemandesDecaissement: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [page, setPage] = useState(1);
  const [newItems, setNewItems] = useState<ItemForm[]>([{ description: "", montant: 0 }]);
  const { toast } = useToast();

  // ==================== Helper functions ====================
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

  // ==================== Fetch data ====================
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

      // Merge and dedupe
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

  useEffect(() => { fetchData(); }, []);

  // ==================== Search ====================
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((i) =>
      `${i.description} ${i.statut} ${i.source}`.toLowerCase().includes(debouncedSearch)
    );
  }, [items, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ==================== Gestion création nouvelle demande ====================
  const addNewItem = () => setNewItems([...newItems, { description: "", montant: 0 }]);
  const removeNewItem = (index: number) => setNewItems(newItems.filter((_, i) => i !== index));
  const updateNewItem = (index: number, field: keyof ItemForm, value: string | number) => {
    const newState = [...newItems];
    newState[index][field] = field === "montant" ? Number(value) : String(value);
    setNewItems(newState);
  };

  const handleCreateDemande = async () => {
    const payload = { items: newItems.filter(i => i.description && i.montant > 0) };
    if (payload.items.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un item valide.", variant: "destructive" });
      return;
    }
    try {
      await financeApi.createDecaissement(payload);
      toast({ title: "Succès", description: "Demande créée." });
      setNewItems([{ description: "", montant: 0 }]);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer la demande.", variant: "destructive" });
    }
  };

  // ==================== Export PDF/Excel ====================
  const exportPDF = async () => {
    const data = filtered.map((i) => [i.description, i.montant, i.statut, i.source]);
    const columns = ["Description", "Montant", "Statut", "Source"];
    await createPDFDoc("Demandes de Décaissement", data, columns, "demandes_decaissement.pdf");
    toast({ title: "Export", description: "PDF exporté." });
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((i) => ({ Description: i.description, Montant: i.montant, Statut: i.statut, Source: i.source }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DemandesDecaissement");
    XLSX.writeFile(workbook, "demandes_decaissement.xlsx");
    toast({ title: "Export", description: "Excel exporté." });
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3"
        />
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>Nouvelle demande</Button>
          <Button onClick={exportPDF}>Exporter PDF</Button>
          <Button onClick={exportExcel}>Exporter Excel</Button>
        </div>
      </div>

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
          {pageItems.map((i) => (
            <TableRow key={`${i.source}-${i.id}`}>
              <TableCell>{i.description}</TableCell>
              <TableCell>{i.montant}</TableCell>
              <TableCell>{i.statut}</TableCell>
              <TableCell>{i.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-2">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
        <span>Page {page} / {totalPages}</span>
        <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
      </div>

      {/* Modal création nouvelle demande */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de décaissement</DialogTitle>
          </DialogHeader>

          {newItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateNewItem(index, "description", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Montant"
                value={item.montant}
                onChange={(e) => updateNewItem(index, "montant", e.target.value)}
              />
              {newItems.length > 1 && (
                <Button variant="destructive" onClick={() => removeNewItem(index)}>Supprimer</Button>
              )}
            </div>
          ))}
          <Button onClick={addNewItem}>Ajouter un item</Button>

          <DialogFooter>
            <Button onClick={handleCreateDemande}>Créer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
