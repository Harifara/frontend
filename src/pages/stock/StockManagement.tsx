import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Article {
  id: string;
  code?: string;
  nom: string;
  type_categorie: string;
  unite_mesure?: string;
}

interface Magasin {
  id: string;
  nom: string;
}

interface Stock {
  id?: string;
  article: Article;
  magasin: Magasin;
  quantite: number;
  seuil_alerte: number;
  date_peremption?: string | null;
}

const StockManagement: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);
  const [form, setForm] = useState({
    article: "",
    magasin: "",
    quantite: 0,
    seuil_alerte: 10,
    date_peremption: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // -----------------------
  // Fetch Data
  // -----------------------
  const getStocks = async () => {
    try {
      const data = await stockApi.getStocks();
      setStocks(data);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de charger les stocks.", variant: "destructive" });
    }
  };

  const getArticles = async () => {
    try {
      const data = await stockApi.getArticles();
      setArticles(data);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de charger les articles.", variant: "destructive" });
    }
  };

  const getMagasins = async () => {
    try {
      const data = await stockApi.getMagasins();
      setMagasins(data);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de charger les magasins.", variant: "destructive" });
    }
  };

  useEffect(() => {
    getStocks();
    getArticles();
    getMagasins();
  }, []);

  // ✅ Toast automatique si stocks faibles
  useEffect(() => {
    const lowStocks = stocks.filter(s => s.quantite <= s.seuil_alerte);
    if (lowStocks.length > 0) {
      toast({
        title: "⚠ Alerte stock",
        description: `${lowStocks.length} article(s) ont un stock faible.`,
        variant: "destructive",
      });
    }
  }, [stocks]);

  // -----------------------
  // CRUD Actions
  // -----------------------
  const handleSave = async () => {
    try {
      const selectedArticle = articles.find(a => a.id === form.article);
      if (selectedArticle?.type_categorie === "consommable" && !form.date_peremption) {
        toast({ title: "Erreur", description: "Les consommables doivent avoir une date de péremption.", variant: "destructive" });
        return;
      }

      const payload = {
        quantite: form.quantite,
        seuil_alerte: form.seuil_alerte,
        date_peremption: form.date_peremption || null,
        article_id: form.article,
        magasin_id: form.magasin,
      };

      if (editingStock?.id) {
        await stockApi.updateStock(editingStock.id, payload);
        toast({ title: "Succès", description: "Stock modifié avec succès" });
      } else {
        await stockApi.createStock(payload);
        toast({ title: "Succès", description: "Stock ajouté avec succès" });
      }

      setOpenModal(false);
      setEditingStock(null);
      setForm({ article: "", magasin: "", quantite: 0, seuil_alerte: 10, date_peremption: "" });
      getStocks();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le stock.", variant: "destructive" });
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setForm({
      article: stock.article.id,
      magasin: stock.magasin.id,
      quantite: stock.quantite,
      seuil_alerte: stock.seuil_alerte,
      date_peremption: stock.date_peremption || "",
    });
    setOpenModal(true);
  };

  const openDeleteModal = (stock: Stock) => {
    setStockToDelete(stock);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!stockToDelete) return;
    try {
      await stockApi.deleteStock(stockToDelete.id!);
      toast({ title: "Succès", description: "Stock supprimé avec succès" });
      setDeleteModalOpen(false);
      setStockToDelete(null);
      getStocks();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "La suppression a échoué", variant: "destructive" });
    }
  };

  // -----------------------
  // Export PDF & Excel
  // -----------------------
  const exportPDF = async () => {
    const data = stocks.map(s => [
      s.article.nom,
      s.magasin.nom,
      `${s.quantite} ${s.article.unite_mesure || ""}`,
      s.seuil_alerte,
      s.date_peremption || "—",
    ]);
    const columns = ["Article", "Magasin", "Quantité", "Seuil Alerte", "Date Péremption"];
    await createPDFDoc("Liste des Stocks", data, columns, "stocks.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      stocks.map(s => ({
        Article: s.article.nom,
        Magasin: s.magasin.nom,
        Quantité: s.quantite,
        "Seuil Alerte": s.seuil_alerte,
        "Date Péremption": s.date_peremption || "—",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stocks");
    XLSX.writeFile(workbook, "stocks.xlsx");
  };

  const filteredStocks = stocks.filter(
    (s) =>
      s.article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.magasin.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gestion des Stocks</h2>
        <div className="flex gap-2">
          <Button onClick={() => { setOpenModal(true); setEditingStock(null); }}>+ Nouveau</Button>
          <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
          <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
        </div>
      </div>

      <Input
        placeholder="Rechercher par article ou magasin..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {/* 🔔 Message global d’alerte */}
      {stocks.some(s => s.quantite <= s.seuil_alerte) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠ Certains articles ont un stock faible !
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Magasin</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Seuil Alerte</TableHead>
              <TableHead>Date Péremption</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStocks.length ? (
              filteredStocks.map((s) => (
                <TableRow
                  key={s.id}
                  className={s.quantite <= s.seuil_alerte ? "bg-red-50" : ""}
                >
                  <TableCell>{s.article?.nom || "—"}</TableCell>
                  <TableCell>{s.magasin?.nom || "—"}</TableCell>
                  <TableCell>
                    {s.quantite} {s.article.unite_mesure || "—"}
                    {s.quantite <= s.seuil_alerte && (
                      <span className="text-red-600 ml-2 font-semibold">⚠ Stock bas</span>
                    )}
                  </TableCell>
                  <TableCell>{s.seuil_alerte}</TableCell>
                  <TableCell>{s.date_peremption || "—"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(s)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteModal(s)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">Aucun stock trouvé.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Ajouter/Modifier */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStock ? "Modifier le Stock" : "Ajouter un Stock"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Article</Label>
              <Select
                value={form.article}
                onValueChange={(val) => setForm({ ...form, article: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Magasin</Label>
              <Select
                value={form.magasin}
                onValueChange={(val) => setForm({ ...form, magasin: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un magasin" />
                </SelectTrigger>
                <SelectContent>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Seuil d’Alerte</Label>
              <Input
                type="number"
                value={form.seuil_alerte}
                onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Date de Péremption</Label>
              <Input
                type="date"
                value={form.date_peremption || ""}
                onChange={(e) => setForm({ ...form, date_peremption: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Voulez-vous vraiment supprimer le stock de <strong>{stockToDelete?.article.nom}</strong> dans <strong>{stockToDelete?.magasin.nom}</strong> ?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;
