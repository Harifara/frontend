import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { stockApi } from "@/lib/api"; // <-- Corrigé ici
import ModalMouvementStock from "./ModalMouvementStock";

export default function MouvementsStock() {
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<any>(null);

  const fetchMouvements = async () => {
    setLoading(true);
    try {
      const data = await stockApi.getMouvements();
      setMouvements(data);
    } catch (err) {
      console.error(err);
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

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Mouvements de Stock</h1>
        <Button onClick={handleAdd}>Ajouter Mouvement</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Magasin Source</TableHead>
            <TableHead>Magasin Dest</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mouvements.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.article?.nom}</TableCell>
              <TableCell>{m.type_mouvement}</TableCell>
              <TableCell>{m.quantite}</TableCell>
              <TableCell>{m.magasin_source?.nom || "-"}</TableCell>
              <TableCell>{m.magasin_dest?.nom || "-"}</TableCell>
              <TableCell>{new Date(m.date_mouvement).toLocaleString()}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEdit(m)}>
                  Modifier
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {openModal && (
        <ModalMouvementStock
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={fetchMouvements}
          editingMouvement={editingMouvement}
        />
      )}
    </div>
  );
}
