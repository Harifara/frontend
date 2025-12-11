import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Decaissement {
  id: string;
  source_service: string;
  created_by: string;
  statut: string;
  depenses?: Depense[];
}

interface Depense {
  id: string;
  description: string;
  montant: number;
  statut_paiement: string;
}

const DemandesDecaissement = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [selectedDecaissement, setSelectedDecaissement] = useState<Decaissement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSourceService, setNewSourceService] = useState("");
  const [newCreatedBy, setNewCreatedBy] = useState("");

  // 🔹 Fetch liste des décaissements
  const fetchDecaissements = async () => {
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch détails d’un décaissement
  const fetchDecaissementDetail = async (id: string) => {
    try {
      const data = await financeApi.getDecaissement(id);
      setSelectedDecaissement(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDecaissements();
  }, []);

  // 🔹 Création d’un décaissement
  const handleCreateDecaissement = async () => {
    try {
      await financeApi.createDecaissement({
        source_service: newSourceService,
        created_by: newCreatedBy,
      });
      setDialogOpen(false);
      setNewSourceService("");
      setNewCreatedBy("");
      fetchDecaissements();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Valider un décaissement
  const handleValider = async (id: string) => {
    try {
      await financeApi.validateDepense(id);
      if (selectedDecaissement?.id === id) fetchDecaissementDetail(id);
      fetchDecaissements();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Rejeter un décaissement
  const handleRejeter = async (id: string) => {
    try {
      // Ici on peut ajouter un commentaire si nécessaire
      console.log("Rejeter décaissement", id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Demandes de Décaissement</h1>
      <Button onClick={() => setDialogOpen(true)}>Créer un décaissement</Button>

      {loading ? (
        <p className="mt-4">Chargement...</p>
      ) : (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Créé par</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decaissements.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{d.source_service}</TableCell>
                <TableCell>{d.created_by}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" onClick={() => fetchDecaissementDetail(d.id)}>
                    Voir
                  </Button>
                  <Button onClick={() => handleValider(d.id)}>Valider</Button>
                  <Button variant="destructive" onClick={() => handleRejeter(d.id)}>
                    Rejeter
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 🔹 Dialog pour création d’un décaissement */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un décaissement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label>Service</label>
              <Input value={newSourceService} onChange={(e) => setNewSourceService(e.target.value)} />
            </div>
            <div>
              <label>Créé par</label>
              <Input value={newCreatedBy} onChange={(e) => setNewCreatedBy(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateDecaissement}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔹 Détails du décaissement sélectionné */}
      {selectedDecaissement && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Décaissement {selectedDecaissement.id}</h2>
          <p>Service : {selectedDecaissement.source_service}</p>
          <p>Créé par : {selectedDecaissement.created_by}</p>
          <p>Statut : {selectedDecaissement.statut}</p>

          <h3 className="text-lg font-semibold mt-4">Dépenses</h3>
          <ul className="mt-2 space-y-1">
            {selectedDecaissement.depenses?.map((d) => (
              <li key={d.id}>
                {d.description} - {d.montant} Ariary - {d.statut_paiement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DemandesDecaissement;
