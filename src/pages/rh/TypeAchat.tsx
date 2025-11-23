// src/pages/rh/TypeAchat.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface TypeAchat {
  id?: string;
  type_achat: string;
  nom: string;
  description?: string;
}

const TypeAchatPage = () => {
  const [types, setTypes] = useState<TypeAchat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TypeAchat | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);

  const [form, setForm] = useState<TypeAchat>({
    type_achat: "",
    nom: "",
    description: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  // Charger les données
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getTypeAchats();
      setTypes(data);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les types d'achat.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir modal
  const handleOpenModal = (item?: TypeAchat) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
    } else {
      setEditingItem(null);
      setForm({ type_achat: "", nom: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Submit form
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.type_achat || !form.nom) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        await rhApi.updateTypeAchat(editingItem.id!, form);
        toast({ title: "Succès", description: "Type d'achat mis à jour." });
      } else {
        await rhApi.createTypeAchat(form);
        toast({ title: "Succès", description: "Type d'achat créé." });
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de l'opération.",
        variant: "destructive",
      });
    }
  };

  // Delete
  const handleOpenDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;

    try {
      setIsDeleteModalOpen(false);
      await rhApi.deleteTypeAchat(selectedIdToDelete);
      toast({ title: "Succès", description: "Type d'achat supprimé." });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  // Filtre recherche
  const filteredTypes = types.filter((t) =>
    t.type_achat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export PDF
  const exportPDF = async () => {
    const data = filteredTypes.map((t) => [
      t.type_achat,
      t.nom,
      t.description || "",
    ]);
    const columns = ["Type", "Nom", "Description"];
    await createPDFDoc("Liste des Types d'Achats", data, columns, "types_achat.pdf");
  };

  // Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTypes.map((t) => ({
        Type: t.type_achat,
        Nom: t.nom,
        Description: t.description || "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Types d'Achats");
    XLSX.writeFile(workbook, "types_achat.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Types d'Achats</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Type d'Achat</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par type, nom ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Types d'Achats</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTypes.length ? (
                filteredTypes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-center">{t.type_achat}</TableCell>
                    <TableCell className="text-center">{t.nom}</TableCell>
                    <TableCell className="text-center">{t.description || "-"}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(t)}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(t.id!)}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    Aucun type d'achat trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajout / Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier le Type d'Achat" : "Créer un Type d'Achat"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Type d'Achat</Label>
              <Input
                value={form.type_achat}
                onChange={(e) => setForm({ ...form, type_achat: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Nom</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit">
                {editingItem ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce type d'achat ?</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TypeAchatPage;
