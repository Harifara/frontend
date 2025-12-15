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

interface Demande {
  id: string;
  reference: string;
  montant: number;
}

const DecaissementsPage: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [demandesDisponibles, setDemandesDisponibles] = useState<{ rh: Demande[]; stock: Demande[] }>({ rh: [], stock: [] });
  const [loading, setLoading] = useState(true);

  const fetchDecaissements = async () => {
    try {
      const data: Decaissement[] = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les décaissements");
    }
  };

  const fetchDemandesDisponibles = async () => {
    try {
      const data: { rh: Demande[]; stock: Demande[] } = await financeApi.getDemandesDisponibles();
      setDemandesDisponibles(data);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les demandes disponibles");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDecaissements();
      await fetchDemandesDisponibles();
      setLoading(false);
    };
    load();
  }, []);

  const handleSoumettre = async (decaissement: Decaissement) => {
    try {
      await financeApi.soumettreDecaissement(decaissement.id);
      toast.success("Décaissement soumis avec succès");
      await fetchDecaissements();
      await fetchDemandesDisponibles();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Erreur lors de la soumission");
    }
  };

  if (loading) return <p>Chargement...</p>;

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

      {/* Liste des demandes disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Demandes RH */}
            <div>
              <h3 className="font-bold mb-2">RH</h3>
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
            </div>

            {/* Demandes Stock */}
            <div>
              <h3 className="font-bold mb-2">Stock</h3>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DecaissementsPage;
