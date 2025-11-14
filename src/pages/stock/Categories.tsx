// src/pages/stock/Categories.tsx
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

interface Categorie {
  id?: string;
  code: string;
  nom: string;
  type_categorie: string;
  description?: string;
  is_active: boolean;
}

const typeOptions = [
  { value: "matiere_premiere", label: "Matière première" },
  { value: "produit_fini", label: "Produit fini" },
  { value: "consommable", label: "Consommable" },
];

const Categories = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Categorie | null>(null);
  const [form, setForm] = useState<Categorie>({ code: "", nom: "", type_categorie: "matiere_premiere", description: "", is_active: true });
  const { toast } = useToast();

  const fetchData = async () => {
  setLoading(true);
  try {
    const data = await stockApi.getCategories(); // ✅ res.json() déjà appelé
    setCategories(data);
  } catch (err: any) {
    toast({
      title: "Erreur",
      description: err.message || "Impossible de charger les catégories.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => { fetchData(); }, []);

  // 🔧 Modals
  const openAddModal = () => {
    setEditing(null);
    setForm({ code: "", nom: "", type_categorie: "matiere_premiere", description: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Categorie) => {
    setEditing(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ Enregistrement
  const handleSubmit = async () => {
    if (!form.code || !form.nom || !form.type_categorie) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    try {
      if (editing?.id) {
        await stockApi.updateCategorie(editing.id, form);
        toast({ title: "Succès", description: "Catégorie modifiée avec succès" });
      } else {
        await stockApi.createCategorie(form);
        toast({ title: "Succès", description: "Catégorie ajoutée avec succès" });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  // ❌ Suppression
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await stockApi.deleteCategorie(selectedIdToDelete);
      toast({ title: "Succès", description: "Catégorie supprimée avec succès" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "La suppression a échoué", variant: "destructive" });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // 🧾 Export PDF
  const exportPDF = async () => {
    const data = categories.map(c => [c.code, c.nom, c.type_categorie, c.is_active ? "Oui" : "Non"]);
    const columns = ["Code", "Nom", "Type", "Actif"];
    await createPDFDoc("Liste des Catégories", data, columns, "categories.pdf");
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      categories.map(c => ({ Code: c.code, Nom: c.nom, Type: c.type_categorie, Actif: c.is_active ? "Oui" : "Non" }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catégories");
    XLSX.writeFile(workbook, "categories.xlsx");
  };

  const filteredCategories = categories.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type_categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Catégories</h1>
        <Button onClick={openAddModal}>Ajouter une catégorie</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par code, nom ou type..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length ? filteredCategories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-center">{c.code}</TableCell>
                  <TableCell className="text-center">{c.nom}</TableCell>
                  <TableCell className="text-center">{c.type_categorie}</TableCell>
                  <TableCell className="text-center">{c.is_active ? "Oui" : "Non"}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(c)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(c.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucune catégorie trouvée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier une catégorie" : "Ajouter une catégorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full border rounded p-2"
                value={form.type_categorie}
                onChange={e => setForm({ ...form, type_categorie: e.target.value })}
              >
                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                id="isActive"
              />
              <Label htmlFor="isActive">Actif</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>{editing ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
