// src/pages/rh/Fonctions.tsx
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

interface Fonction {
  id?: string;
  nom_fonction: string;
  description: string;
}

const Fonctions = () => {
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingFonction, setEditingFonction] = useState<Fonction | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Fonction>({ nom_fonction: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getFonctions();
      setFonctions(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les fonctions.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (fonction?: Fonction) => {
    if (fonction) {
      setEditingFonction(fonction);
      setForm(fonction);
    } else {
      setEditingFonction(null);
      setForm({ nom_fonction: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFonction(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.nom_fonction) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom de la fonction.", variant: "destructive" });
      return;
    }

    const payload = {
      nom_fonction: form.nom_fonction,
      description: form.description,
    };

    try {
      if (editingFonction) {
        await rhApi.updateFonction(editingFonction.id!, payload);
        toast({ title: "Succès", description: "Fonction mise à jour." });
      } else {
        await rhApi.createFonction(payload);
        toast({ title: "Succès", description: "Fonction créée." });
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'opération.", variant: "destructive" });
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      await rhApi.deleteFonction(selectedIdToDelete);
      toast({ title: "Succès", description: "Fonction supprimée." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredFonctions = fonctions.filter(f =>
    f.nom_fonction.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    const data = filteredFonctions.map(f => [f.nom_fonction, f.description]);
    const columns = ["Nom", "Description"];
    await createPDFDoc("Liste des Fonctions", data, columns, "fonctions.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFonctions.map(f => ({ Nom: f.nom_fonction, Description: f.description }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fonctions");
    XLSX.writeFile(workbook, "fonctions.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fonctions</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter une Fonction</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par nom ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Fonctions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFonctions.length ? filteredFonctions.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="text-center">{f.nom_fonction}</TableCell>
                  <TableCell className="text-center">{f.description}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(f)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(f.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">Aucune fonction trouvée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajout/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingFonction ? "Modifier la fonction" : "Créer une fonction"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nom_fonction">Nom</Label>
              <Input
                id="nom_fonction"
                value={form.nom_fonction}
                onChange={(e) => setForm({ ...form, nom_fonction: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingFonction ? "Mettre à jour" : "Créer"}</Button>
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
          <p>Êtes-vous sûr de vouloir supprimer cette fonction ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fonctions;
