// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

interface ValidationDemande {
  id: string;
  numero: string;
  type_demande: string;
  montant: number;
  description: string;
  statut: string;
}

const DemandesDecaissement: React.FC = () => {
  const [validations, setValidations] = useState<ValidationDemande[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValidations, setSelectedValidations] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const res = await axios.get<ValidationDemande[]>("/api/demandes-decaissement/validations-en-attente/");
      setValidations(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les validations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, []);

  const toggleValidation = (id: string) => {
    setSelectedValidations(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const createDecaissement = async () => {
    if (!selectedValidations.length) {
      toast.error("Veuillez sélectionner au moins une validation.");
      return;
    }

    try {
      await axios.post("/api/demandes-decaissement/", {
        validations_ids: selectedValidations,
        justification,
        demandeur_finance_id: "UUID_DU_RESPONSABLE" // TODO: remplacer dynamiquement
      });
      toast.success("Décaissement créé avec succès !");
      setIsModalOpen(false);
      setSelectedValidations([]);
      setJustification("");
      fetchValidations();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || "Erreur lors de la création");
      } else {
        toast.error("Erreur inattendue");
      }
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Validations en attente de décaissement</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}>Créer Décaissement</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : validations.length === 0 ? (
            <p>Aucune validation en attente</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sélection</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validations.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedValidations.includes(v.id)}
                        onChange={() => toggleValidation(v.id)}
                      />
                    </TableCell>
                    <TableCell>{v.numero}</TableCell>
                    <TableCell>{v.type_demande}</TableCell>
                    <TableCell>{v.montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</TableCell>
                    <TableCell>{v.description}</TableCell>
                    <TableCell>{v.statut}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer Décaissement</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full border rounded px-2 py-1"
              placeholder="Justification"
              value={justification}
              onChange={e => setJustification(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={createDecaissement}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
