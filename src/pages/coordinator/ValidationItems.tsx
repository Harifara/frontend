import React, { useEffect, useState } from "react";
import { coordinateurApi } from "@/lib/coordinateurApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  description: string;
  montant: number;
  statut: string;
}

const ValidationItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await coordinateurApi.getValidations();
      setItems(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les items.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openValidationModal = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      await coordinateurApi.approveItem(selectedItem.id);
      toast({ title: "Succès", description: "Item approuvé" });
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'approuver.", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    try {
      await coordinateurApi.rejectItem(selectedItem.id, "Rejeté par coordinateur");
      toast({ title: "Succès", description: "Item rejeté" });
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de rejeter.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Validation des Items</h1>

      <Card>
        <CardHeader>
          <CardTitle>Liste des items à valider</CardTitle>
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
              {items.length ? items.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="text-center">{i.description}</TableCell>
                  <TableCell className="text-center">{i.montant}</TableCell>
                  <TableCell className="text-center">{i.statut}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openValidationModal(i)}>Valider / Rejeter</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucun item à valider.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Valider ou rejeter l'item</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button onClick={handleApprove}>Approuver</Button>
            <Button onClick={handleReject} variant="destructive">Rejeter</Button>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValidationItems;
