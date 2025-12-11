import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";

// -------------------------
// Interfaces
// -------------------------
interface DepenseItem {
  id: string;
  description: string;
  montant: number;
  statut: string;
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

interface Demande {
  id: string;
  description: string;
  montant: number;
  status: string;
}

// Badge couleur
const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "valide": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [demandesRH, setDemandesRH] = useState<Demande[]>([]);
  const [demandesStock, setDemandesStock] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemandes, setSelectedDemandes] = useState<string[]>([]);
  const { toast } = useToast();

  // ---------------- Fetch Décaissements & demandes ----------------
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDecaissements();
      const data = await res.json();
      setDecaissements(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les décaissements.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchDemandes = async () => {
    try {
      const rh = await rhApi.getDemandes();
      const stock = await stockApi.getDemandesAchat();
      setDemandesRH(rh.results || rh);
      setDemandesStock(stock.results || stock);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les demandes.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchDecaissements();
    fetchDemandes();
  }, []);

  // ---------------- Créer un décaissement ----------------
  const handleCreateDecaissement = async () => {
    if (selectedDemandes.length === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins une demande.", variant: "destructive" });
      return;
    }

    try {
      const payload = { demande_ids: selectedDemandes };
      await financeApi.createDecaissement(payload);
      toast({ title: "Succès", description: "Décaissement créé." });
      setIsModalOpen(false);
      setSelectedDemandes([]);
      fetchDecaissements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer le décaissement.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements</h1>
      <Button onClick={() => setIsModalOpen(true)}>Créer un décaissement</Button>

      {/* ---------------- Table des décaissements ---------------- */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Dépenses</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.length ? decaissements.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.source_service}</TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
              <TableCell>{d.total_montant.toLocaleString()} Ar</TableCell>
              <TableCell><span className={badgeColor(d.statut)}>{d.statut}</span></TableCell>
              <TableCell>
                <ul className="ml-2 list-disc">
                  {d.depenses.map(dep => (
                    <li key={dep.id}>
                      {dep.description} - {dep.montant.toLocaleString()} Ar
                      {" "}<span className={badgeColor(dep.statut)}>{dep.statut}</span>
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="space-x-2">
                {d.statut === "en_attente" && (
                  <>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await financeApi.updateDecaissement(d.id, { statut: "valide" });
                      toast({ title: "Décaissement approuvé" });
                      fetchDecaissements();
                    }}>Approuver</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      if (!confirm("Rejeter ce décaissement ?")) return;
                      await financeApi.updateDecaissement(d.id, { statut: "rejete" });
                      toast({ title: "Décaissement rejeté" });
                      fetchDecaissements();
                    }}>Rejeter</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">Aucun décaissement trouvé.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ---------------- Modal Création ---------------- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un décaissement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="font-medium">Sélectionner les demandes à inclure :</p>

            <MultiSelect
              items={[
                ...demandesRH.map(d => ({ value: d.id, label: `RH: ${d.description} (${d.montant} Ar)` })),
                ...demandesStock.map(d => ({ value: d.id, label: `Stock: ${d.description} (${d.montant} Ar)` }))
              ]}
              selected={selectedDemandes}
              onChange={setSelectedDemandes}
            />

            <p>Total estimé: {selectedDemandes.reduce((acc, id) => {
              const d = [...demandesRH, ...demandesStock].find(x => x.id === id);
              return acc + (d?.montant || 0);
            }, 0).toLocaleString()} Ar</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateDecaissement}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
