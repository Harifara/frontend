// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// -----------------
// Types
// -----------------
interface Decaissement {
  id: string;
  reference?: string;
  montant_total: number;
  statut: string;
  date_creation: string;
  date_decaissement?: string;
  demandes_rh_ids?: string[];
  demandes_stock_ids?: string[];
}

interface DemandeRH {
  id: string;
  description: string;
  montant: number;
  status: string;
}

interface DemandeStock {
  id: string;
  numero: string;
  montant_estime: number;
  statut: string;
}

// Labels et couleurs des statuts
const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_attente_coordonnateur: "En attente validation coordonnateur",
  approuve: "Approuvé",
  rejete: "Rejeté",
  decaisse: "Décaissement effectué",
};

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-gray-200 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-200 text-yellow-800",
  approuve: "bg-green-200 text-green-800",
  rejete: "bg-red-200 text-red-800",
  decaisse: "bg-blue-200 text-blue-800",
};

// -----------------
// Composant principal
// -----------------
export default function DemandesDecaissement() {
  const { user } = useAuth();
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Decaissement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesStock, setDemandesStock] = useState<DemandeStock[]>([]);
  const [selectedRHIds, setSelectedRHIds] = useState<string[]>([]);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const { toast } = useToast();

  // -----------------
  // Fetch décaissements
  // -----------------
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data.results || data);
    } catch (error) {
      console.error("Erreur lors du chargement des décaissements :", error);
      toast({ title: "Erreur", description: "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // -----------------
  // Fetch demandes RH et Stock
  // -----------------
  const fetchDemandesSources = async () => {
    try {
      const [rhData, stockData] = await Promise.all([rhApi.getDemandesRH(), stockApi.getDemandesAchat()]);
      setDemandesRH(rhData.results || rhData);
      setDemandesStock(stockData.results || stockData);
    } catch (err) {
      console.error("Erreur récupération RH/Stock :", err);
      toast({ title: "Erreur", description: "Impossible de récupérer les demandes RH ou Stock.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchDecaissements();
    fetchDemandesSources();
  }, []);

  // -----------------
  // Soumettre décaissement
  // -----------------
  const handleSoumettre = async (decaissement: Decaissement) => {
    setSubmitting(true);
    try {
      await financeApi.updateDecaissement(decaissement.id, { statut: "en_attente_coordonnateur" });
      toast({ title: "Succès", description: "Décaissement soumis au coordonnateur." });
      fetchDecaissements();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
      toast({ title: "Erreur", description: "Impossible de soumettre le décaissement.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------
  // Création d’un décaissement
  // -----------------
  const handleCreateDecaissement = async () => {
    if (!user?.id) {
      toast({ title: "Erreur", description: "Utilisateur non connecté.", variant: "destructive" });
      return;
    }

    if (!selectedRHIds.length && !selectedStockIds.length) {
      toast({ title: "Erreur", description: "Sélectionnez au moins une demande RH ou Stock.", variant: "destructive" });
      return;
    }

    const montantRH = demandesRH.filter(d => selectedRHIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant || 0), 0);
    const montantStock = demandesStock.filter(d => selectedStockIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant_estime || 0), 0);
    const montantTotal = montantRH + montantStock;

    const payload = {
      demandes_rh_ids: selectedRHIds,
      demandes_stock_ids: selectedStockIds,
      montant_total: montantTotal,
      cree_par_id: user.id,
    };

    setSubmitting(true);
    try {
      await financeApi.createDecaissement(payload);
      toast({ title: "Succès", description: "Décaissement créé." });
      setModalCreateOpen(false);
      setSelectedRHIds([]);
      setSelectedStockIds([]);
      fetchDecaissements();
    } catch (error) {
      console.error("Erreur création :", error);
      toast({ title: "Erreur", description: "Impossible de créer le décaissement.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------
  // Filtrer les demandes déjà utilisées
  // -----------------
  const availableRH = demandesRH.filter(d => 
    !decaissements.some(dec => dec.demandes_rh_ids?.includes(d.id))
  );

  const availableStock = demandesStock.filter(d => 
    !decaissements.some(dec => dec.demandes_stock_ids?.includes(d.id))
  );

  // -----------------
  // Render
  // -----------------
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Demandes de Décaissement</h1>
        <Button onClick={() => setModalCreateOpen(true)}>Nouvelle Demande</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin w-8 h-8 mr-2" /> Chargement...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Référence</TableCell>
              <TableCell>Montant total</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date création</TableCell>
              <TableCell>Date décaissement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decaissements.length ? decaissements.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.reference || d.id}</TableCell>
                <TableCell>{Number(d.montant_total || 0).toFixed(2)} Ar</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${STATUT_COLORS[d.statut] || "bg-gray-100 text-gray-700"}`}>
                    {STATUT_LABELS[d.statut] || d.statut}
                  </span>
                </TableCell>
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
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Aucune demande de décaissement
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Dialog soumettre */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soumettre la demande au coordonnateur</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir soumettre la demande {selected?.reference || selected?.id} ?</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={() => selected && handleSoumettre(selected)} disabled={submitting}>
              {submitting ? "Soumission..." : "Soumettre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal création */}
      <Dialog open={modalCreateOpen} onOpenChange={setModalCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau décaissement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="font-medium">Demandes RH</label>
              <MultiSelect
                items={availableRH.map(d => ({ value: d.id, label: `${d.description} (${d.montant} Ar)` }))}
                selected={selectedRHIds}
                onChange={setSelectedRHIds}
              />
            </div>
            <div>
              <label className="font-medium">Demandes Stock</label>
              <MultiSelect
                items={availableStock.map(d => ({ value: d.id, label: `${d.numero} (${d.montant_estime} Ar)` }))}
                selected={selectedStockIds}
                onChange={setSelectedStockIds}
              />
            </div>
            <div className="text-right font-semibold">
              Montant total : {(
                availableRH.filter(d => selectedRHIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant || 0), 0) +
                availableStock.filter(d => selectedStockIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant_estime || 0), 0)
              ).toFixed(2)} Ar
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalCreateOpen(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleCreateDecaissement} disabled={submitting}>
              {submitting ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
