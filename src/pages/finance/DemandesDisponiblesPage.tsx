import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface Demande {
  id: string;
  reference: string;
  montant: number;
}

const DemandesDisponiblesPage: React.FC = () => {
  const [demandesDisponibles, setDemandesDisponibles] = useState<{ rh: Demande[]; stock: Demande[] }>({ rh: [], stock: [] });
  const [loading, setLoading] = useState(true);

  const fetchDemandesDisponibles = async () => {
    try {
      console.log("[DEBUG] Appel API pour récupérer les demandes disponibles...");
      const data: { rh: Demande[]; stock: Demande[] } = await financeApi.getDemandesDisponibles();
      console.log("[DEBUG] Réponse API:", data);

      // Vérification du format des données
      if (!data || !data.rh || !data.stock) {
        console.warn("[WARN] Données API mal formattées:", data);
        toast.error("Les données reçues sont invalides");
        setDemandesDisponibles({ rh: [], stock: [] });
        return;
      }

      setDemandesDisponibles(data);
      console.log("[DEBUG] Données RH:", data.rh);
      console.log("[DEBUG] Données Stock:", data.stock);

    } catch (err: any) {
      console.error("[ERROR] Impossible de charger les demandes disponibles:", err);
      toast.error(err?.response?.data?.error || "Erreur lors du chargement des demandes disponibles");
      setDemandesDisponibles({ rh: [], stock: [] });
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDemandesDisponibles();
      setLoading(false);
    };
    load();
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
