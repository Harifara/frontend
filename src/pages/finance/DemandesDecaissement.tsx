import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface DepenseItem {
  description: string;
  montant: number;
}

interface Decaissement {
  id: string;
  source_service: string;
  created_by: string;
  date_creation: string;
  total_montant: number;
  statut: string;
  depenses: DepenseItem[];
}

const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDepenses, setNewDepenses] = useState<DepenseItem[]>([{ description: "", montant: 0 }]);
  const { toast } = useToast();

  // ---------------- Fetch decaissements ----------------
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDecaissements();
      const data = await res.json();
      setDecaissements(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecaissements(); }, []);

  // ---------------- Gestion des dépenses dans la modal ----------------
  const addDepense = () => setNewDepenses([...newDepenses, { description: "", montant: 0 }]);
  const removeDepense = (index: number) => setNewDepenses(newDepenses.filter((_, i) => i !== index));
  const updateDepense = (index: number, field: "description" | "montant", value: string | number) => {
    const updated = [...newDepenses];
    updated[index][field] = field === "montant" ? Number(value) : String(value);
    setNewDepenses(updated);
  };

  const handleCreateDecaissement = async () => {
    const payload = {
      depenses: newDepenses.filter(d => d.description && d.montant > 0),
      created_by: userId,
      source_service: "finance",
    };
    if (!payload.depenses.length) {
      toast({ title: "Erreur", description: "Ajoutez au moins une dépense valide.", variant: "destructive" });
      return;
    }
    try {
      await financeApi.createDecaissement(payload);
      toast({ title: "Succès", description: "Décaissement créé." });
      setNewDepenses([{ description: "", montant: 0 }]);
      setIsModalOpen(false);
      fetchDecaissements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer le décaissement.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => setIsModalOpen(true)}>Nouvelle demande</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.source_service}</TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
              <TableCell>{d.total_montant}</TableCell>
              <TableCell>{d.statut}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal création décaissement */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de décaissement</DialogTitle>
          </DialogHeader>

          {newDepenses.map((dep, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Description"
                value={dep.description}
                onChange={(e) => updateDepense(index, "description", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Montant"
                value={dep.montant}
                onChange={(e) => updateDepense(index, "montant", e.target.value)}
              />
              {newDepenses.length > 1 && (
                <Button variant="destructive" onClick={() => removeDepense(index)}>Supprimer</Button>
              )}
            </div>
          ))}

          <Button onClick={addDepense}>Ajouter une dépense</Button>

          <DialogFooter>
            <Button onClick={handleCreateDecaissement}>Créer le décaissement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
