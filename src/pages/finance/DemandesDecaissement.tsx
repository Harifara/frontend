import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { rhApi, stockApi, financeApi } from "@/lib/api"; // Assurez-vous que vos API sont configurées

// Types pour les demandes
interface DemandeRH {
  id: string;
  description: string;
  montant: number;
}

interface DemandeStock {
  id: string;
  article_nom: string;
  quantite: number;
  montant_estime: number;
}

interface SelectedDemande {
  id: string;
  type: "RH" | "Stock";
  montant: number;
}

const DemandeDecaissementPage = () => {
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesStock, setDemandesStock] = useState<DemandeStock[]>([]);
  const [selectedDemandes, setSelectedDemandes] = useState<SelectedDemande[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les demandes RH et Stock
  const fetchDemandes = async () => {
    try {
      const rhRes = await rhApi.getDemandes(); // Ajuster selon ton API
      const stockRes = await stockApi.getDemandes();
      setDemandesRH(rhRes.data);
      setDemandesStock(stockRes.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des demandes :", err);
      alert("Impossible de récupérer les demandes.");
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Fonction pour créer le décaissement
  const createDecaissement = async () => {
    if (selectedDemandes.length === 0) {
      alert("Sélectionnez au moins une demande !");
      return;
    }

    setLoading(true);

    try {
      const payload = selectedDemandes.map((d) => ({
        source_type: d.type,
        source_id: d.id,
        montant: d.montant,
      }));

      await financeApi.createDecaissement({ depenses: payload });

      alert("Décaissement créé avec succès !");
      setSelectedDemandes([]);
      fetchDemandes();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la création du décaissement.");
    } finally {
      setLoading(false);
    }
  };

  // Calcul du montant total
  const totalMontant = selectedDemandes.reduce((acc, d) => acc + d.montant, 0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Créer un Décaissement</h1>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Demandes RH</h2>
        <ul>
          {demandesRH.map((d) => (
            <li key={d.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDemandes.some(s => s.id === d.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDemandes([...selectedDemandes, { id: d.id, type: "RH", montant: d.montant }]);
                    } else {
                      setSelectedDemandes(selectedDemandes.filter(s => s.id !== d.id));
                    }
                  }}
                />
                {" "}
                {d.description} - {d.montant.toLocaleString()} Ar
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Demandes Stock</h2>
        <ul>
          {demandesStock.map((d) => (
            <li key={d.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDemandes.some(s => s.id === d.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDemandes([...selectedDemandes, { id: d.id, type: "Stock", montant: d.montant_estime }]);
                    } else {
                      setSelectedDemandes(selectedDemandes.filter(s => s.id !== d.id));
                    }
                  }}
                />
                {" "}
                {d.article_nom} x {d.quantite} - {d.montant_estime.toLocaleString()} Ar
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <strong>Montant total sélectionné : </strong>{totalMontant.toLocaleString()} Ar
      </div>

      <Button onClick={createDecaissement} disabled={loading || selectedDemandes.length === 0}>
        {loading ? "Création en cours..." : "Créer le décaissement"}
      </Button>
    </div>
  );
};

export default DemandeDecaissementPage;
