import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// -------------------------
// Interfaces
// -------------------------
interface Demande {
  id: string;
  source: "RH" | "Stock";
  description: string;
  montant: number;
  status: string;
}

interface Decaissement {
  id: string;
  source_service: string;
  created_by: string;
  date_creation: string;
  total_montant: number;
  statut: string;
  depenses: any[];
}

// Badge couleur
const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "valide": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en attente":
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemandes, setSelectedDemandes] = useState<string[]>([]);
  const { toast } = useToast();

  // ---------------- Fetch Décaissements & demandes ----------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rhRes, stockRes, decRes] = await Promise.all([
        rhApi.getDemandes(),
        stockApi.getDemandes(), // <-- correction ici
        financeApi.getDecaissements()
      ]);

      // Normaliser toutes les demandes
      const rh = (rhRes.results || rhRes).map((d: any) => ({
        id: d.id,
        source: "RH" as const,
        description: d.description,
        montant: d.montant,
        status: d.status,
      }));

      const stock = (stockRes.results || stockRes).map((d: any) => ({
        id: d.id,
        source: "Stock" as const,
        description: d.article?.nom || d.description || "-",
        montant: d.montant_estime || d.montant || 0,
        status: d.statut || "en_attente",
      }));

      setDemandes([...rh, ...stock]);
      setDecaissements(decRes); // si financeApi.getDecaissements() renvoie déjà JSON

    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les données.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ---------------- Créer décaissement ----------------
  const handleCreateDecaissement = async () => {
    if (selectedDemandes.length === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins une demande.", variant: "destructive" });
      return;
    }

    try {
      await financeApi.createDecaissement({ demande_ids: selectedDemandes });
      toast({ title: "Succès", description: "Décaissement créé." });
      setIsModalOpen(false);
      setSelectedDemandes([]);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer le décaissement.", variant: "destructive" });
    }
  };

  const toggleDemandeSelection = (id: string) => {
    setSelectedDemandes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  const totalSelected = selectedDemandes.reduce((acc, id) => {
    const d = demandes.find(x => x.id === id);
    return acc + (d?.montant || 0);
  }, 0);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements</h1>

      <Button onClick={() => setIsModalOpen(true)}>Créer un décaissement</Button>

      <h2 className="text-xl font-semibold mt-6">Toutes les demandes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sélection</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedDemandes.includes(d.id)}
                  onChange={() => toggleDemandeSelection(d.id)}
                />
              </TableCell>
              <TableCell>{d.source}</TableCell>
              <TableCell>{d.description}</TableCell>
              <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
              <TableCell><span className={badgeColor(d.status)}>{d.status}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="mt-2 font-medium">Total sélectionné: {totalSelected.toLocaleString()} Ar</p>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un décaissement</DialogTitle>
          </DialogHeader>
          <p>Sélectionnez les demandes à inclure depuis le tableau ci-dessus.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateDecaissement}>Créer ({totalSelected.toLocaleString()} Ar)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
