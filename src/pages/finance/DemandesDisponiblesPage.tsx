import React, { useEffect, useState } from "react";
import { rhApi, stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface Demande {
  id: string;
  reference: string;
  montant: number;
}

interface DemandesDisponibles {
  rh: Demande[];
  stock: Demande[];
}

const DemandesDisponiblesPage: React.FC = () => {
  const [demandesDisponibles, setDemandesDisponibles] = useState<DemandesDisponibles>({
    rh: [],
    stock: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDemandesDisponibles = async () => {
    try {
      console.log("[DEBUG] Récupération des demandes RH et Stock...");
      const [rhData, stockData] = await Promise.all([
        rhApi.getDemandesRH().catch((err) => {
          console.error("Erreur RH:", err);
          return [];
        }),
        stockApi.getDemandesStock().catch((err) => {
          console.error("Erreur Stock:", err);
          return [];
        }),
      ]);

      // Sécurisation : toujours des tableaux
      setDemandesDisponibles({
        rh: Array.isArray(rhData) ? rhData : [],
        stock: Array.isArray(stockData) ? stockData : [],
      });

      console.log("[DEBUG] Données RH:", rhData);
      console.log("[DEBUG] Données Stock:", stockData);
    } catch (err: any) {
      console.error("[ERROR] Impossible de charger les demandes:", err);
      toast.error(err?.message || "Erreur lors du chargement des demandes");
      setDemandesDisponibles({ rh: [], stock: [] });
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDemandesDisponibles().finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement des demandes disponibles...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandes RH Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {demandesDisponibles.rh.length === 0 ? (
            <p>Aucune demande RH disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesDisponibles.rh.map((r) => (
                <li key={r.id}>
                  {r.reference} - {r.montant.toLocaleString()} Ar
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes Stock Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {demandesDisponibles.stock.length === 0 ? (
            <p>Aucune demande Stock disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesDisponibles.stock.map((s) => (
                <li key={s.id}>
                  {s.reference} - {s.montant.toLocaleString()} Ar
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandesDisponiblesPage;
