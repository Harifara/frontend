// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Types pour les données
interface Depense {
  id: string;
  description: string;
  montant: number;
  statut: string;
  date_creation: string;
}

interface Decaissement {
  id: string;
  source_service: string;
  date_creation: string;
  total_montant: number;
  statut: string;
  depenses: Depense[];
}

// -------------------------
// Composant principal
// -------------------------
export const DemandesDecaissement: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Decaissement | null>(null);
  const [newDepenseDesc, setNewDepenseDesc] = useState<string>("");
  const [newDepenseMontant, setNewDepenseMontant] = useState<number>(0);

  // Charger les demandes
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecaissements();
  }, []);

  // Actions
  const handleEnvoyer = async (id: string) => {
    await financeApi.envoyerAuCoordo(id);
    fetchDecaissements();
  };

  const handleAddDepense = async () => {
    if (!selected) return;
    await financeApi.createDepense({
      demande: selected.id,
      description: newDepenseDesc,
      montant: newDepenseMontant,
    });
    setNewDepenseDesc("");
    setNewDepenseMontant(0);
    fetchDecaissements();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Demandes de Décaissement</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decaissements.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.source_service}</TableCell>
                <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                <TableCell>{d.total_montant.toFixed(2)}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>
                  <Button onClick={() => setSelected(d)}>Voir / Modifier</Button>
                  {d.statut === "non_envoyee" && (
                    <Button className="ml-2" onClick={() => handleEnvoyer(d.id)}>
                      Envoyer au coordo
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog pour détails d'une demande */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>

          {selected && (
            <div>
              <p><strong>Source:</strong> {selected.source_service}</p>
              <p><strong>Total:</strong> {selected.total_montant.toFixed(2)}</p>
              <p><strong>Statut:</strong> {selected.statut}</p>

              <h3 className="mt-4 font-semibold">Dépenses</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.depenses.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell>{dep.description}</TableCell>
                      <TableCell>{dep.montant.toFixed(2)}</TableCell>
                      <TableCell>{dep.statut}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <h3 className="mt-4 font-semibold">Ajouter une dépense</h3>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Description"
                  value={newDepenseDesc}
                  onChange={(e) => setNewDepenseDesc(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Montant"
                  value={newDepenseMontant}
                  onChange={(e) => setNewDepenseMontant(parseFloat(e.target.value))}
                />
                <Button onClick={handleAddDepense}>Ajouter</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelected(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
