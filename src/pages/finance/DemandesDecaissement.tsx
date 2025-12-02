// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api"; // Assure-toi d'avoir les endpoints CRUD
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface DemandeDecaissement {
  id: string;
  numero: string;
  montant: number;
  description: string;
  statut: string;
}

const DemandesDecaissement: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDecaissement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDemande, setEditingDemande] = useState<DemandeDecaissement | null>(null);
  const [numero, setNumero] = useState("");
  const [montant, setMontant] = useState<number>(0);
  const [description, setDescription] = useState("");

  // Charger toutes les demandes
  const fetchDemandes = async () => {
    try {
      const res = await financeApi.get("/demandes-decaissement");
      setDemandes(res.data);
    } catch (error) {
      toast.error("Impossible de charger les demandes");
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Ouvrir modal pour création
  const openCreateModal = () => {
    setEditingDemande(null);
    setNumero("");
    setMontant(0);
    setDescription("");
    setIsModalOpen(true);
  };

  // Ouvrir modal pour édition
  const openEditModal = (demande: DemandeDecaissement) => {
    setEditingDemande(demande);
    setNumero(demande.numero);
    setMontant(demande.montant);
    setDescription(demande.description);
    setIsModalOpen(true);
  };

  // Créer ou mettre à jour une demande
  const saveDemande = async () => {
    try {
      if (editingDemande) {
        // Édition
        await financeApi.put(`/demandes-decaissement/${editingDemande.id}`, {
          numero,
          montant,
          description,
        });
        toast.success("Demande mise à jour avec succès");
      } else {
        // Création
        await financeApi.post("/demandes-decaissement", {
          numero,
          montant,
          description,
        });
        toast.success("Demande créée avec succès");
      }
      setIsModalOpen(false);
      fetchDemandes();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // Supprimer une demande
  const deleteDemande = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande ?")) return;
    try {
      await financeApi.delete(`/demandes-decaissement/${id}`);
      toast.success("Demande supprimée");
      fetchDemandes();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Décaissement</CardTitle>
          <Button onClick={openCreateModal}>Nouvelle Demande</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.map((demande) => (
                <TableRow key={demande.id}>
                  <TableCell>{demande.numero}</TableCell>
                  <TableCell>{demande.montant}</TableCell>
                  <TableCell>{demande.description}</TableCell>
                  <TableCell>{demande.statut}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(demande)}>
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteDemande(demande.id)}>
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Création/Édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDemande ? "Modifier la demande" : "Nouvelle demande"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Numéro"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Montant"
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
            />
            <textarea
              className="w-full border rounded px-2 py-1"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={saveDemande}>{editingDemande ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
