import React, { useEffect, useState } from "react";
import { financeApi, authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Item {
  description: string;
  montant: number;
}

interface Demande {
  id: string;
  total_montant: number;
  statut: string;
  items: Item[];
  created_by: string;
}

const DemandesDecaissement: React.FC = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItems, setNewItems] = useState<Item[]>([{ description: "", montant: 0 }]);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authApi.me();
        setUserId(user.id);
      } catch (err: any) {
        toast({ title: "Erreur", description: "Impossible de récupérer l'utilisateur.", variant: "destructive" });
      }
    };
    fetchUser();
  }, []);

  // Récupérer les demandes existantes
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDemandes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Gestion ajout/modification items
  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const itemsCopy = [...newItems];
    itemsCopy[index][field] = field === "montant" ? Number(value) : String(value);
    setNewItems(itemsCopy);
  };

  const addItem = () => setNewItems([...newItems, { description: "", montant: 0 }]);
  const removeItem = (index: number) => setNewItems(newItems.filter((_, i) => i !== index));

  // Création de la demande
  const handleCreateDemande = async () => {
    if (!userId) return toast({ title: "Erreur", description: "Utilisateur non identifié.", variant: "destructive" });

    const itemsToSend = newItems.filter(i => i.description && i.montant > 0);
    if (itemsToSend.length === 0) return toast({ title: "Erreur", description: "Ajoutez au moins un item valide.", variant: "destructive" });

    const payload = { created_by: userId, items: itemsToSend };

    try {
      await financeApi.createDecaissement(payload);
      toast({ title: "Succès", description: "Demande de décaissement créée." });
      setNewItems([{ description: "", montant: 0 }]);
      setIsModalOpen(false);
      fetchDemandes();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer la demande.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <Button onClick={() => setIsModalOpen(true)}>Créer une demande de décaissement</Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.items.map(i => i.description).join(", ")}</TableCell>
              <TableCell>{d.total_montant}</TableCell>
              <TableCell>{d.statut}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande de décaissement</DialogTitle>
          </DialogHeader>
          {newItems.map((item, index) => (
            <div key={index} className="flex gap-2 my-2">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleItemChange(index, "description", e.target.value)}
              />
              <Input
                placeholder="Montant"
                type="number"
                value={item.montant}
                onChange={(e) => handleItemChange(index, "montant", Number(e.target.value))}
              />
              <Button variant="destructive" onClick={() => removeItem(index)}>Supprimer</Button>
            </div>
          ))}
          <Button onClick={addItem}>Ajouter un item</Button>

          <DialogFooter>
            <Button onClick={handleCreateDemande}>Créer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
