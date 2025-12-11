// src/pages/coordo/ValidationsCoordo.tsx
import React, { useEffect, useState } from "react";
import { cordoApi } from "@/lib/api"; // Assurez-vous d'avoir l'API Cordo
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


// Types
interface Validation {
  id: string;
  decaissement_id: string;
  coordo_id: string;
  decision: string;
  commentaire: string;
  date_decision: string;
}

interface Decaissement {
  id: string;
  source_service: string;
  date_creation: string;
  total_montant: number;
  statut: string;
}

// -------------------------
// Composant principal
// -------------------------
export const ValidationsCoordo: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Decaissement | null>(null);
  const [commentaire, setCommentaire] = useState<string>("");

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await cordoApi.getDecaissements(); // Lister les demandes à valider
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

  const handleDecision = async (decision: "valide" | "rejete") => {
    if (!selected) return;
    await cordoApi.validerDecaissement(selected.id, {
      coordo_commentaire: commentaire,
      decision,
    });
    setCommentaire("");
    setSelected(null);
    fetchDecaissements();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Validations Coordonnateur</h1>

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
                  <Button onClick={() => setSelected(d)}>Valider / Rejeter</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog pour valider ou rejeter */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Décaissement {selected?.id}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-2">
              <p><strong>Source:</strong> {selected.source_service}</p>
              <p><strong>Total:</strong> {selected.total_montant.toFixed(2)}</p>
              <p><strong>Statut:</strong> {selected.statut}</p>

              <Textarea
                placeholder="Commentaire (optionnel)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />

              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleDecision("valide")}>Valider</Button>
                <Button onClick={() => handleDecision("rejete")} variant="destructive">Rejeter</Button>
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

export default ValidationsCoordo;
