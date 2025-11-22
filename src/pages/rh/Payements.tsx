// src/pages/rh/Payements.tsx
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
  id: string;
  mode_payement: string;
}

interface Payement {
  id?: string;
  montant?: number;
  date_payement?: string;
  status?: string;
  reference?: string;
  mode_payement?: ModePayement;
  mode_payement_id?: string;
}

const PayementsPage = () => {
  const [payements, setPayements] = useState<Payement[]>([]);
  const [modesPayement, setModesPayement] = useState<ModePayement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayement, setEditingPayement] = useState<Payement | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form, setForm] = useState<Payement>({ montant: undefined, mode_payement_id: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchModes();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getPayements();
      setPayements(data || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les paiements.", variant: "destructive" });
      setPayements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModes = async () => {
    try {
      const data = await rhApi.getModePayements();
      setModesPayement(data || []);
    } catch (err: any) {
      console.error(err);
      setModesPayement([]);
    }
  };

  const handleOpenModal = (payement?: Payement) => {
    if (payement) {
      setEditingPayement(payement);
      setForm({
        montant: payement.montant,
        mode_payement_id: payement.mode_payement?.id || "",
      });
    } else {
      setEditingPayement(null);
      setForm({ montant: undefined, mode_payement_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayement(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.montant || !form.mode_payement_id) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    try {
      if (editingPayement) {
        await rhApi.updatePayement(editingPayement.id!, form);
        toast({ title: "Succès", description: "Paiement mis à jour." });
      } else {
        await rhApi.createPayement(form);
        toast({ title: "Succès", description: "Paiement créé." });
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
      await rhApi.deletePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Paiement supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredPayements = payements.filter(p =>
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mode_payement?.mode_payement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Export PDF
  const exportPDF = async () => {
    const data = filteredPayements.map(p => [p.reference, p.montant, p.status, p.mode_payement?.mode_payement || ""]);
    const columns = ["Référence", "Montant", "Statut", "Mode de Paiement"];
    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  // --- Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map(p => ({
        Référence: p.reference,
        Montant: p.montant,
        Statut: p.status,
        "Mode de Paiement": p.mode_payement?.mode_payement || ""
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payements");
    XLSX.writeFile(workbook, "payements.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Paiement</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par référence ou mode de paiement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Référence</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Mode de Paiement</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayements.length ? filteredPayements.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">{p.reference}</TableCell>
                  <TableCell className="text-center">{p.montant}</TableCell>
                  <TableCell className="text-center">{p.status}</TableCell>
                  <TableCell className="text-center">{p.mode_payement?.mode_payement}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(p)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(p.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun paiement trouvé.</TableCell>
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
            <DialogTitle>{editingPayement ? "Modifier le Paiement" : "Créer un Paiement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="montant">Montant</Label>
              <Input
                id="montant"
                type="number"
                value={form.montant || ""}
                onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mode">Mode de Paiement</Label>
              <select
                id="mode"
                value={form.mode_payement_id}
                onChange={(e) => setForm({ ...form, mode_payement_id: e.target.value })}
                className="w-full border rounded p-2"
                required
              >
                <option value="">-- Sélectionner un mode --</option>
                {modesPayement.map((m) => (
                  <option key={m.id} value={m.id}>{m.mode_payement}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingPayement ? "Mettre à jour" : "Créer"}</Button>
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
          <p>Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayementsPage;
