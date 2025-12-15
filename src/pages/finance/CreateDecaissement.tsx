import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface Decaissement {
  id: string;
  reference: string;
  montant_total: number;
  statut: string;
  demandes_rh_ids: string[];
  demandes_stock_ids: string[];
}

const DecaissementsPage: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecaissements = async () => {
    try {
      console.log("[DEBUG] Chargement des décaissements...");
      const data: Decaissement[] = await financeApi.getDecaissements();
      console.log("[DEBUG] Décaissements reçus :", data);
      setDecaissements(data);
    } catch (err) {
      console.error("[ERROR] Impossible de charger les décaissements:", err);
      toast.error("Impossible de charger les décaissements");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDecaissements();
      setLoading(false);
    };
    load();
  }, []);

  const handleSoumettre = async (decaissement: Decaissement) => {
    try {
      console.log("[DEBUG] Soumission du décaissement :", decaissement.id);
      await financeApi.soumettreDecaissement(decaissement.id);
      toast.success("Décaissement soumis avec succès");
      await fetchDecaissements();
    } catch (err: any) {
      console.error("[ERROR] Erreur lors de la soumission du décaissement :", err);
      toast.error(err?.response?.data?.error || "Erreur lors de la soumission");
    }
  };

  if (loading) return <p>Chargement des décaissements...</p>;

  return (
    <div className="space-y-6">
      {/* Liste des décaissements */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Décaissement</CardTitle>
        </CardHeader>
        <CardContent>
          {decaissements.length === 0 ? (
            <p>Aucune demande pour le moment</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="border p-2">Référence</th>
                  <th className="border p-2">Montant Total</th>
                  <th className="border p-2">Statut</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {decaissements.map((d) => (
                  <tr key={d.id}>
                    <td className="border p-2">{d.reference}</td>
                    <td className="border p-2">{d.montant_total.toLocaleString()} Ar</td>
                    <td className="border p-2">{d.statut}</td>
                    <td className="border p-2">
                      {d.statut === "brouillon" && (
                        <Button onClick={() => handleSoumettre(d)}>Soumettre</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DecaissementsPage;
