import React, { useEffect, useState } from "react";
import { rhApi, stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface Demande {
  id: string;
  reference: string;
  montant: number;
}

const DemandesDisponiblesPage: React.FC = () => {
  const [demandesRH, setDemandesRH] = useState<Demande[]>([]);
  const [demandesStock, setDemandesStock] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemandes = async () => {
    try {
      // RH
      const rh: Demande[] = await rhApi.getDemandesRH();
      setDemandesRH(rh);
      console.log("[DEBUG] Demandes RH:", rh);

      // Stock
      const stock: Demande[] = await stockApi.getDemandesAchat();
      setDemandesStock(stock);
      console.log("[DEBUG] Demandes Stock:", stock);

    } catch (err: any) {
      console.error("[ERROR] Impossible de charger les demandes:", err);
      toast.error(err.message || "Erreur lors du chargement des demandes");
      setDemandesRH([]);
      setDemandesStock([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDemandes().finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement des demandes disponibles...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandes RH Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {demandesRH.length === 0 ? (
            <p>Aucune demande RH disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesRH.map((r) => (
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
          {demandesStock.length === 0 ? (
            <p>Aucune demande Stock disponible</p>
          ) : (
            <ul className="list-disc list-inside">
              {demandesStock.map((s) => (
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
