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
  const [expandedTypes, setExpandedTypes] = useState<{ [key: string]: boolean }>({});

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

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Mouvements de Stock</h1>
        <Button onClick={handleAdd}>Ajouter Mouvement</Button>
      </div>

      {loading && <p className="text-gray-500">Chargement des mouvements...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && mouvements.length === 0 && <p>Aucun mouvement trouvé.</p>}

      <div className="space-y-4">
        {!loading &&
          Object.entries(mouvementsParType).map(([type, mouvements]) => (
            <Card key={type} className="border shadow-sm rounded-lg">
              <button
                onClick={() => toggleType(type)}
                className="w-full text-left p-4 bg-gray-100 font-semibold flex justify-between items-center"
              >
                <span>{type}</span>
                <span>{mouvements.length} mouvement{mouvements.length > 1 ? "s" : ""}</span>
                <span>{expandedTypes[type] ? "▲" : "▼"}</span>
              </button>
              {expandedTypes[type] && (
                <CardContent className="p-4 space-y-3">
                  {mouvements.map((m: any) => (
                    <Card key={m.id} className="shadow-md hover:shadow-lg transition p-3">
                      <CardHeader>
                        <CardTitle>{m.article?.nom || "Article inconnu"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p><strong>Quantité:</strong> {m.quantite}</p>
                        <p><strong>Source:</strong> {m.magasin_source?.nom || "-"}</p>
                        <p><strong>Destination:</strong> {m.magasin_dest?.nom || "-"}</p>
                        <p><strong>Date:</strong> {new Date(m.date_mouvement).toLocaleString()}</p>
                      </CardContent>
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>Modifier</Button>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              )}
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
