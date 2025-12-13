// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface Decaissement {
  id: string;
  montant_total: number;
  statut: string;
  date_creation: string;
  date_decaissement?: string;
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_attente_coordonnateur: "En attente validation coordonnateur",
  approuve: "Approuvé",
  rejete: "Rejeté",
  decaisse: "Décaissement effectué",
};

export default function DemandesDecaissement() {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Decaissement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (error) {
      console.error("Erreur lors du chargement des décaissements :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoumettre = async (decaissement: Decaissement) => {
    setSubmitting(true);
    try {
      await financeApi.updateDecaissement(decaissement.id, { statut: "en_attente_coordonnateur" });
      fetchDecaissements();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDecaissements();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Demandes de Décaissement</h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-8 h-8 mr-2" /> Chargement...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Montant total</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date création</TableCell>
              <TableCell>Date décaissement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decaissements.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{d.montant_total.toFixed(2)} Ar</TableCell>
                <TableCell>{STATUT_LABELS[d.statut] || d.statut}</TableCell>
                <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                <TableCell>{d.date_decaissement ? new Date(d.date_decaissement).toLocaleString() : "-"}</TableCell>
                <TableCell>
                  {d.statut === "brouillon" && (
                    <Button size="sm" onClick={() => { setSelected(d); setDialogOpen(true); }}>
                      Soumettre
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soumettre la demande au coordonnateur</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir soumettre la demande {selected?.id} ?</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button
              onClick={() => selected && handleSoumettre(selected)}
              disabled={submitting}
            >
              {submitting ? "Soumission..." : "Soumettre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
