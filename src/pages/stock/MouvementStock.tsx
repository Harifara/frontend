import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { stockApi } from "@/lib/api";
import ModalMouvementStock from "./ModalMouvementStock";
import { useAuth } from "@/contexts/AuthContext";

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
   const { user } = useAuth();
    const isResponsableStock = user?.role === "responsable_stock";

  const handleAdd = () => {
    setEditingMouvement(null);
    setOpenModal(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Mouvements de Stock</h1>
        {!isResponsableStock && (
          <Button onClick={handleAdd}>Ajouter Mouvement</Button>
        )}

      </div>

      {loading && <p className="text-gray-500">Chargement des mouvements...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && mouvements.length === 0 && <p>Aucun mouvement trouvé.</p>}

      {!loading && mouvements.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Magasin Source</TableHead>
              <TableHead>Magasin Dest</TableHead>
              <TableHead>Date</TableHead>
              {!isResponsableStock && (
              <TableHead>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mouvements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.article?.nom || "-"}</TableCell>
                <TableCell>{m.type_mouvement}</TableCell>
                <TableCell>{m.quantite}</TableCell>
                <TableCell>{m.magasin_source?.nom || "-"}</TableCell>
                <TableCell>{m.magasin_dest?.nom || "-"}</TableCell>
                <TableCell>{new Date(m.date_mouvement).toLocaleString()}</TableCell>
                <TableCell>
                  {!isResponsableStock && (
                  <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>Modifier</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
