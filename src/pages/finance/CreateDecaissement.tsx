// src/pages/finance/CreateDecaissement.tsx
import React, { useEffect, useState } from "react";
import { rhApi, stockApi, financeApi } from "@/lib/api";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DemandeRH {
  id: string;
  description: string;
  montant: number;
}

interface DemandeStock {
  id: string;
  numero: string;
  montant_estime: number;
}

export default function CreateDecaissement() {
  const { user } = useAuth();
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesStock, setDemandesStock] = useState<DemandeStock[]>([]);
  const [availableRH, setAvailableRH] = useState<DemandeRH[]>([]);
  const [availableStock, setAvailableStock] = useState<DemandeStock[]>([]);
  const [selectedRHIds, setSelectedRHIds] = useState<string[]>([]);
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch demandes et décaissements existants
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rhData, stockData, decaissementsData] = await Promise.all([
        rhApi.getDemandesRH(),
        stockApi.getDemandesAchat(),
        financeApi.getDecaissements()
      ]);
      const rh = rhData.results || rhData;
      const stock = stockData.results || stockData;
      const decaissements = decaissementsData.results || decaissementsData;

      const usedRHIds = decaissements.flatMap(d => d.demandes_rh_ids || []);
      const usedStockIds = decaissements.flatMap(d => d.demandes_stock_ids || []);

      setAvailableRH(rh.filter((d: DemandeRH) => !usedRHIds.includes(d.id)));
      setAvailableStock(stock.filter((d: DemandeStock) => !usedStockIds.includes(d.id)));
      setDemandesRH(rh);
      setDemandesStock(stock);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de récupérer les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!user?.id) return toast({ title: "Erreur", description: "Utilisateur non connecté.", variant: "destructive" });
    if (!selectedRHIds.length && !selectedStockIds.length) return toast({ title: "Erreur", description: "Sélectionnez au moins une demande.", variant: "destructive" });

    const montantRH = availableRH.filter(d => selectedRHIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant || 0), 0);
    const montantStock = availableStock.filter(d => selectedStockIds.includes(d.id)).reduce((acc, d) => acc + Number(d.montant_estime || 0), 0);

    setSubmitting(true);
    try {
      await financeApi.createDecaissement({
        demandes_rh_ids: selectedRHIds,
        demandes_stock_ids: selectedStockIds,
        montant_total: montantRH + montantStock,
        cree_par_id: user.id
      });
      toast({ title: "Succès", description: "Décaissement créé." });
      setSelectedRHIds([]);
      setSelectedStockIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de créer le décaissement.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin w-8 h-8 mr-2" />Chargement...</div>;

  return (
    <div className="p-4 space-y-4">
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
      <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Création..." : "Créer"}</Button>
    </div>
  );
}
