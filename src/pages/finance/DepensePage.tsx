import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Depense {
  id?: string;
  numero: string;
  description: string;
  montant: number;
  statut: string;
}

const Depenses = () => {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Depense | null>(null);
  const [form, setForm] = useState<Depense>({ numero: "", description: "", montant: 0, statut: "en_attente" });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDepenses();
      setDepenses(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les dépenses.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🔧 Modals
  const openAddModal = () => {
    setEditing(null);
    setForm({ numero: "", description: "", montant: 0, statut: "en_attente" });
    setIsModalOpen(true);
  };

  const openEditModal = (depense: Depense) => {
    setEditing(depense);
    setForm(depense);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ Enregistrement
  const handleSubmit = async () => {
    if (!form.numero || !form.description || !form.montant) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    try {
      if (editing?.id) {
        await financeApi.updateDepense(editing.id, form);
        toast({ title: "Succès", description: "Dépense modifiée avec succès" });
      } else {
        await financeApi.createDepense(form);
        toast({ title: "Succès", description: "Dépense ajoutée avec succès" });
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
      await financeApi.deleteDepense(selectedIdToDelete);
      toast({ title: "Succès", description: "Dépense supprimée avec succès" });
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
    const data = depenses.map(d => [d.numero, d.description, d.montant, d.statut]);
    const columns = ["Numéro", "Description", "Montant", "Statut"];
    await createPDFDoc("Liste des Dépenses", data, columns, "depenses.pdf");
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      depenses.map(d => ({ Numéro: d.numero, Description: d.description, Montant: d.montant, Statut: d.statut }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dépenses");
    XLSX.writeFile(workbook, "depenses.xlsx");
  };

  const filteredDepenses = depenses.filter(d =>
    d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.statut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dépenses</h1>
        <Button onClick={openAddModal}>Ajouter une dépense</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par numéro, description ou statut..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Numéro</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepenses.length ? filteredDepenses.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-center">{d.numero}</TableCell>
                  <TableCell className="text-center">{d.description}</TableCell>
                  <TableCell className="text-center">{d.montant}</TableCell>
                  <TableCell className="text-center">{d.statut}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(d)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(d.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucune dépense trouvée.</TableCell>
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
            <DialogTitle>{editing ? "Modifier la dépense" : "Ajouter une dépense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Numéro</Label>
              <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Montant</Label>
              <Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Statut</Label>
              <Input value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} />
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
            Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
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

export default Depenses;
