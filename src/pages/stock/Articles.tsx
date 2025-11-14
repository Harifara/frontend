// src/pages/stock/Articles.tsx
import React, { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Article {
  id?: string;
  code: string;
  nom: string;
  description?: string;
  unite_mesure: string;
  prix_unitaire_estime?: number | string | null;
  categorie: { id: string; nom: string };
  is_active: boolean;
}

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<Article>({
    code: "",
    nom: "",
    description: "",
    unite_mesure: "unité",
    prix_unitaire_estime: undefined,
    categorie: { id: "", nom: "" },
    is_active: true,
  });
  const { toast } = useToast();

  // 📥 Charger les articles et catégories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        stockApi.getArticles(),
        stockApi.getCategories(),
      ]);
      setCategories(categoriesData);
      setArticles(
        articlesData.map((a: any) => ({
          ...a,
          categorie: a.categorie || { id: "", nom: "" },
        }))
      );
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les articles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔧 Modals
  const openAddModal = () => {
    setEditing(null);
    setForm({
      code: "",
      nom: "",
      description: "",
      unite_mesure: "unité",
      prix_unitaire_estime: undefined,
      categorie: { id: "", nom: "" },
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (a: Article) => {
    setEditing(a);
    setForm(a);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ Enregistrement avec correction de la catégorie
  const handleSubmit = async () => {
    if (!form.code || !form.nom || !form.categorie.id) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      code: form.code,
      nom: form.nom,
      description: form.description,
      unite_mesure: form.unite_mesure,
      prix_unitaire_estime:
        form.prix_unitaire_estime != null
          ? Number(form.prix_unitaire_estime)
          : null,
      is_active: form.is_active,
      categorie_id: form.categorie.id, // ⚡ bien aligné avec le serializer
    };

    try {
      if (editing?.id) {
        await stockApi.updateArticle(editing.id, payload);
        toast({ title: "Succès", description: "Article modifié avec succès" });
      } else {
        await stockApi.createArticle(payload);
        toast({ title: "Succès", description: "Article ajouté avec succès" });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // ❌ Suppression
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await stockApi.deleteArticle(selectedIdToDelete);
      toast({ title: "Succès", description: "Article supprimé avec succès" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "La suppression a échoué",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // 🧾 Export PDF
  const exportPDF = async () => {
    const data = articles.map((a) => [
      a.code,
      a.nom,
      a.categorie?.nom || "",
      a.unite_mesure,
      a.prix_unitaire_estime != null
        ? Number(a.prix_unitaire_estime).toFixed(2)
        : "",
      a.is_active ? "Oui" : "Non",
    ]);
    const columns = ["Code", "Nom", "Catégorie", "Unité", "Prix Estimé en Ariary", "Actif"];
    await createPDFDoc("Liste des Articles", data, columns, "articles.pdf");
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      articles.map((a) => ({
        Code: a.code,
        Nom: a.nom,
        Catégorie: a.categorie?.nom || "",
        Unité: a.unite_mesure,
        Prix:
          a.prix_unitaire_estime != null
            ? Number(a.prix_unitaire_estime).toFixed(2)
            : "",
        Actif: a.is_active ? "Oui" : "Non",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Articles");
    XLSX.writeFile(workbook, "articles.xlsx");
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.categorie?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Button onClick={openAddModal}>Ajouter un article</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par code, nom ou catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">
          Exporter PDF
        </Button>
        <Button onClick={exportExcel} variant="outline">
          Exporter Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Catégorie</TableHead>
                <TableHead className="text-center">Unité</TableHead>
                <TableHead className="text-center">Prix Estimé</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length ? (
                filteredArticles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-center">{a.code}</TableCell>
                    <TableCell className="text-center">{a.nom}</TableCell>
                    <TableCell className="text-center">
                      {a.categorie?.nom}
                    </TableCell>
                    <TableCell className="text-center">
                      {a.unite_mesure}
                    </TableCell>
                    <TableCell className="text-center">
                      {a.prix_unitaire_estime != null
                        ? Number(a.prix_unitaire_estime).toFixed(2)
                        : ""} Ar
                    </TableCell>
                    <TableCell className="text-center">
                      {a.is_active ? "Oui" : "Non"}
                    </TableCell>
                    <TableCell className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(a)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteModal(a.id!)}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Aucun article trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal d’ajout/modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier un article" : "Ajouter un article"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <select
                className="w-full border rounded p-2"
                value={form.categorie.id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categorie: {
                      id: e.target.value,
                      nom:
                        categories.find((c) => c.id === e.target.value)?.nom ||
                        "",
                    },
                  })
                }
              >
                <option value="">-- Sélectionner --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Unité de mesure</Label>
              <Input
                value={form.unite_mesure}
                onChange={(e) =>
                  setForm({ ...form, unite_mesure: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Prix unitaire estimé</Label>
              <Input
                type="number"
                step="0.01"
                value={form.prix_unitaire_estime ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    prix_unitaire_estime: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                id="isActive"
              />
              <Label htmlFor="isActive">Actif</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>
              {editing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est
            irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Articles;
