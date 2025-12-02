// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

interface ValidationDemande {
  id: string;
  numero: string;
  type_demande: string;
  montant: number;
  description: string;
  statut: string;
}

interface DemandeDecaissement {
  id: string;
  numero: string;
  type_decaissement_nom: string;
  montant_demande: number;
  justification: string;
  statut: string;
  validations: ValidationDemande[];
}

const DemandesDecaissement: React.FC = () => {
  const [validations, setValidations] = useState<ValidationDemande[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValidations, setSelectedValidations] = useState<string[]>([]);
  const [justification, setJustification] = useState("");

  const fetchValidations = async () => {
    try {
      const res = await axios.get("/api/demandes-decaissement/validations-en-attente/");
      setValidations(res.data);
    } catch (error) {
      toast.error("Impossible de charger les validations");
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
      const res = await axios.post("/api/demandes-decaissement/", {
        validations_ids: selectedValidations,
        justification,
        demandeur_finance_id: "UUID_DU_RESPONSABLE" // à remplacer dynamiquement
      });
      toast.success("Décaissement créé avec succès !");
      setIsModalOpen(false);
      setSelectedValidations([]);
      setJustification("");
      fetchValidations();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Validations en attente de décaissement</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}>Créer Décaissement</Button>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{v.montant}</TableCell>
                  <TableCell>{v.description}</TableCell>
                  <TableCell>{v.statut}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
