import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { stockApi } from "@/lib/api";
import ModalMouvementStock from "./ModalMouvementStock";

export default function MouvementsStock() {
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMouvements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockApi.getMouvements();
      setMouvements(data);
    } catch (err: any) {
      console.error("Erreur récupération mouvements :", err);
      setError("Impossible de récupérer les mouvements. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMouvements();
  }, []);

  const handleEdit = (mouvement: any) => {
    setEditingMouvement(mouvement);
    setOpenModal(true);
  };

  const handleAdd = () => {
    setEditingMouvement(null);
    setOpenModal(true);
  };

  // Grouper les mouvements par type
  const mouvementsParType = mouvements.reduce((acc: any, mouvement) => {
    const type = mouvement.type_mouvement || "Inconnu";
    if (!acc[type]) acc[type] = [];
    acc[type].push(mouvement);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Mouvements de Stock</h1>
        <Button onClick={handleAdd}>Ajouter Mouvement</Button>
      </div>

      {loading && <p className="text-gray-500">Chargement des mouvements...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && mouvements.length === 0 && <p>Aucun mouvement trouvé.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading &&
          Object.entries(mouvementsParType).map(([type, mouvements]) => (
            <Card key={type} className="border">
              <CardHeader>
                <CardTitle>{type}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mouvements.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-2 border rounded flex justify-between items-center"
                  >
                    <div>
                      <p><strong>Article:</strong> {m.article?.nom || "-"}</p>
                      <p><strong>Quantité:</strong> {m.quantite}</p>
                      <p><strong>Source:</strong> {m.magasin_source?.nom || "-"}</p>
                      <p><strong>Destination:</strong> {m.magasin_dest?.nom || "-"}</p>
                      <p><strong>Date:</strong> {new Date(m.date_mouvement).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(m)}
                    >
                      Modifier
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
      </div>

      {openModal && (
        <ModalMouvementStock
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            fetchMouvements();
            setOpenModal(false);
          }}
          editingMouvement={editingMouvement}
        />
      )}
    </div>
  );
}
