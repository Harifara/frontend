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

interface Item {
  id: string;
  description: string;
  montant: number;
  statut: string;
}

const DemandesDecaissement = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getItems();
      setItems(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les items.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openEditModal = (item: Item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const handleUpdateStatut = async (statut: string) => {
    if (!editing) return;
    try {
      await financeApi.updateItem(editing.id, statut);
      toast({ title: "Succès", description: `Statut mis à jour à "${statut}"` });
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  };

  const filteredItems = items.filter(i =>
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.statut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    const data = filteredItems.map(i => [i.description, i.montant, i.statut]);
    const columns = ["Description", "Montant", "Statut"];
    await createPDFDoc("Demandes de Décaissement", data, columns, "demandes_decaissement.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map(i => ({ Description: i.description, Montant: i.montant, Statut: i.statut }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DemandesDecaissement");
    XLSX.writeFile(workbook, "demandes_decaissement.xlsx");
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1" />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length ? filteredItems.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="text-center">{i.description}</TableCell>
                  <TableCell className="text-center">{i.montant}</TableCell>
                  <TableCell className="text-center">{i.statut}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(i)}>Modifier Statut</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucun item trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={() => handleUpdateStatut("en_attente")}>En attente</Button>
            <Button onClick={() => handleUpdateStatut("validé")}>Validé</Button>
            <Button onClick={() => handleUpdateStatut("rejeté")} variant="destructive">Rejeté</Button>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
