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

interface DecaissementPayload {
  source_service: string;
  total_montant: number;
  depenses?: { description: string; montant: number }[];
}

const DemandesDecaissement: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Decaissement | null>(null);
  const [newDepenseDesc, setNewDepenseDesc] = useState("");
  const [newDepenseMontant, setNewDepenseMontant] = useState<number | "">(0);
  const [error, setError] = useState("");

  // Charger les demandes
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du chargement des décaissements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecaissements();
  }, []);

  // Envoyer au coordonnateur
  const handleEnvoyer = async (id: string) => {
    try {
      await financeApi.envoyerAuCoordo(id);
      fetchDecaissements();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'envoi au coordonnateur.");
    }
  };

  // Ajouter une dépense
  const handleAddDepense = async () => {
    if (!selected) return;
    if (!newDepenseDesc || !newDepenseMontant) {
      setError("Veuillez saisir la description et le montant.");
      return;
    }

    try {
      await financeApi.updateDecaissement(selected.id, {
        depenses: [...selected.depenses, { description: newDepenseDesc, montant: newDepenseMontant }],
      });
      setNewDepenseDesc("");
      setNewDepenseMontant(0);
      setError("");
      fetchDecaissements();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'ajout de la dépense.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Demandes de Décaissement</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

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
            {decaissements.length ? (
              decaissements.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.source_service}</TableCell>
                  <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                  <TableCell>{d.total_montant.toLocaleString()}</TableCell>
                  <TableCell>{d.statut}</TableCell>
                  <TableCell className="space-x-2">
                    <Button onClick={() => setSelected(d)}>Voir / Modifier</Button>
                    {d.statut === "non_envoyee" && (
                      <Button variant="outline" onClick={() => handleEnvoyer(d.id)}>
                        Envoyer au coordo
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucune demande trouvée.
                </TableCell>
              </TableRow>
            )}
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
              <p>
                <strong>Source:</strong> {selected.source_service}
              </p>
              <p>
                <strong>Total:</strong> {selected.total_montant.toLocaleString()}
              </p>
              <p>
                <strong>Statut:</strong> {selected.statut}
              </p>

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
                      <TableCell>{dep.montant.toLocaleString()}</TableCell>
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
                <Button disabled={!newDepenseDesc || !newDepenseMontant} onClick={handleAddDepense}>
                  Ajouter
                </Button>
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
