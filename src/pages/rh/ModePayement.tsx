// src/pages/rh/ModePayement.tsx
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

interface ModePayement {
  id?: string;
  mode_payement: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const ModePayementPage = () => {
  const [modes, setModes] = useState<ModePayement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<ModePayement | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<ModePayement>({ mode_payement: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getModePayements();
      setModes(data || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les modes de paiement.", variant: "destructive" });
      setModes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode?: ModePayement) => {
    if (mode) {
      setEditingMode(mode);
      setForm({ ...mode });
    } else {
      setEditingMode(null);
      setForm({ mode_payement: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMode(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.mode_payement) {
      toast({ title: "Erreur", description: "Le mode de paiement est requis.", variant: "destructive" });
      return;
    }

    try {
      if (editingMode) {
        await rhApi.updateModePayement(editingMode.id!, form);
        toast({ title: "Succès", description: "Mode de paiement mis à jour." });
      } else {
        await rhApi.createModePayement(form);
        toast({ title: "Succès", description: "Mode de paiement créé." });
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
      await rhApi.deleteModePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Mode de paiement supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredModes = modes.filter(m =>
    m.mode_payement.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // --- Export PDF
  const exportPDF = async () => {
    const data = filteredModes.map(m => [m.mode_payement, m.description || ""]);
    const columns = ["Mode de Paiement", "Description"];
    await createPDFDoc("Liste des Modes de Paiement", data, columns, "mode_payements.pdf");
  };

  // --- Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredModes.map(m => ({ "Mode de Paiement": m.mode_payement, Description: m.description || "" }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ModesPaiement");
    XLSX.writeFile(workbook, "mode_payements.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Modes de Paiement</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Mode de Paiement</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par mode ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Modes de Paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Mode de Paiement</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModes.length ? filteredModes.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-center">{m.mode_payement}</TableCell>
                  <TableCell className="text-center">{m.description}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(m)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(m.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">Aucun mode de paiement trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Création / Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMode ? "Modifier le Mode de Paiement" : "Créer un Mode de Paiement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mode_payement">Mode de Paiement</Label>
              <Input
                id="mode_payement"
                value={form.mode_payement}
                onChange={(e) => setForm({ ...form, mode_payement: e.target.value })}
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
              <Button type="submit">{editingMode ? "Mettre à jour" : "Créer"}</Button>
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
          <p>Êtes-vous sûr de vouloir supprimer ce mode de paiement ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModePayementPage;
