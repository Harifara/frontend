import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface Demande {
  id: string;
  reference: string;
  montant: number;
}

interface DecaissementPayload {
  demandes_rh_ids: string[];
  demandes_stock_ids: string[];
  montant_total: number;
}

const CreerDecaissementPage: React.FC = () => {
  const [demandesRH, setDemandesRH] = useState<Demande[]>([]);
  const [demandesStock, setDemandesStock] = useState<Demande[]>([]);
  const [selectedRH, setSelectedRH] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // 🔹 Récupérer les demandes RH et Stock
  const fetchDemandes = async () => {
    try {
      const [rhData, stockData] = await Promise.all([
        rhApi.getDemandesRH(),
        stockApi.getDemandesStock(),
      ]);
      setDemandesRH(Array.isArray(rhData) ? rhData : []);
      setDemandesStock(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      console.error("Erreur récupération demandes:", err);
      toast.error("Impossible de charger les demandes disponibles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // 🔹 Gestion de sélection des demandes
  const handleSelectRH = (id: string) => {
    setSelectedRH(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectStock = (id: string) => {
    setSelectedStock(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 🔹 Calcul du montant total sélectionné
  const montantTotal = () => {
    const totalRH = demandesRH
      .filter(d => selectedRH.includes(d.id))
      .reduce((sum, d) => sum + (d.montant ?? 0), 0);
    const totalStock = demandesStock
      .filter(d => selectedStock.includes(d.id))
      .reduce((sum, d) => sum + (d.montant ?? 0), 0);
    return totalRH + totalStock;
  };

  // 🔹 Création du décaissement
  const handleCreateDecaissement = async () => {
    if (selectedRH.length === 0 && selectedStock.length === 0) {
      toast.error("Sélectionnez au moins une demande");
      return;
    }

    const payload: DecaissementPayload = {
      demandes_rh_ids: selectedRH,
      demandes_stock_ids: selectedStock,
      montant_total: montantTotal(),
    };

    try {
      setCreating(true);
      await financeApi.createDecaissement(payload);
      toast.success("Décaissement créé avec succès");
      // Réinitialiser les sélections et recharger les demandes
      setSelectedRH([]);
      setSelectedStock([]);
      await fetchDemandes();
    } catch (err) {
      console.error("Erreur création décaissement:", err);
      toast.error("Impossible de créer le décaissement");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p>Chargement des demandes disponibles...</p>;

  return (
    <div className="space-y-6">
      {/* DEMANDES RH */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes RH Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {demandesRH.length === 0 ? (
            <p>Aucune demande RH disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesRH.map(d => (
                <li key={d.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedRH.includes(d.id)}
                      onChange={() => handleSelectRH(d.id)}
                      className="mr-2"
                    />
                    {d.reference} - {(d.montant ?? 0).toLocaleString()} Ar
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* DEMANDES STOCK */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes Stock Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {demandesStock.length === 0 ? (
            <p>Aucune demande Stock disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesStock.map(d => (
                <li key={d.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedStock.includes(d.id)}
                      onChange={() => handleSelectStock(d.id)}
                      className="mr-2"
                    />
                    {d.reference} - {(d.montant ?? 0).toLocaleString()} Ar
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* MONTANT TOTAL ET BOUTON */}
      <div className="flex justify-end items-center space-x-4">
        <span className="font-bold">Montant total: {montantTotal().toLocaleString()} Ar</span>
        <Button onClick={handleCreateDecaissement} disabled={creating}>
          {creating ? "Création..." : "Créer Décaissement"}
        </Button>
      </div>
    </div>
  );
};

export default CreerDecaissementPage;
