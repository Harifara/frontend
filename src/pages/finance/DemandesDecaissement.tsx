// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { 
  Table, TableHeader, TableBody, TableRow, TableCell 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface DemandeDecaissement {
  id: string;
  numero: string;
  montant: number;
  description: string;
  statut: string;
  created_at: string;
}

const DemandesDecaissementPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDecaissement[]>([]);
  const [selected, setSelected] = useState<DemandeDecaissement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  // Charger la liste des demandes
  const fetchDemandes = async () => {
    try {
      const data = await financeApi.getDemandesDecaissement();
      setDemandes(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des demandes");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Ouvrir modal pour visualiser ou valider/rejeter
  const openDialog = (demande: DemandeDecaissement) => {
    setSelected(demande);
    setCommentaire("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelected(null);
    setIsDialogOpen(false);
  };

  // Valider une demande
  const handleValider = async () => {
    if (!selected) return;
    try {
      await financeApi.validerDemandeDecaissement(selected.id);
      toast.success("Demande validée");
      closeDialog();
      fetchDemandes();
    } catch (error) {
      toast.error("Erreur lors de la validation");
      console.error(error);
    }
  };

  // Rejeter une demande
  const handleRejeter = async () => {
    if (!selected) return;
    try {
      await financeApi.rejeterDemandeDecaissement(selected.id, commentaire);
      toast.success("Demande rejetée");
      closeDialog();
      fetchDemandes();
    } catch (error) {
      toast.error("Erreur lors du rejet");
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Décaissement</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Numéro</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.map((demande) => (
                <TableRow key={demande.id}>
                  <TableCell>{demande.numero}</TableCell>
                  <TableCell>{demande.montant.toLocaleString()}</TableCell>
                  <TableCell>{demande.description}</TableCell>
                  <TableCell>{demande.statut}</TableCell>
                  <TableCell>{new Date(demande.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => openDialog(demande)}>
                      Détails / Actions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal pour valider/rejeter */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails Demande</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div>
                <strong>Numéro:</strong> {selected.numero}
              </div>
              <div>
                <strong>Montant:</strong> {selected.montant.toLocaleString()}
              </div>
              <div>
                <strong>Description:</strong> {selected.description}
              </div>
              <div>
                <strong>Statut:</strong> {selected.statut}
              </div>

              <Textarea
                placeholder="Commentaire pour le rejet"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleRejeter}>
              Rejeter
            </Button>
            <Button onClick={handleValider}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissementPage;
