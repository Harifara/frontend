// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { stockApi, rhApi, financeApi } from "@/lib/api";

type DemandeDetail = {
  id: string;
  numero?: string;
  description?: string;
  montant: number;
  statut: string;
  source: "rh" | "stock";
};

const badgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approuve": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "decaisse": return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DemandesDecaissementPage: React.FC = () => {
  const [demandes, setDemandes] = useState<DemandeDetail[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const rhRes = await rhApi.getDemandes();
      const stockRes = await stockApi.getDemandesAchat();
      const allDemandes: DemandeDetail[] = [
        ...(rhRes.results || []).map((d: any) => ({
          id: d.id,
          description: d.description,
          montant: Number(d.montant || 0),
          statut: d.status.toLowerCase().replace(/\s/g, "_"),
          source: "rh",
        })),
        ...(stockRes.results || []).map((d: any) => ({
          id: d.id,
          description: d.numero || d.description || "-",
          montant: Number(d.montant_estime || 0),
          statut: d.statut.toLowerCase().replace(/\s/g, "_"),
          source: "stock",
        })),
      ];
      // On ne garde que les demandes validées côté coordo
      setDemandes(allDemandes.filter(d => d.statut === "approuve"));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des demandes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateDecaissement = async () => {
    if (!selectedIds.length) {
      toast.error("Sélectionnez au moins une demande !");
      return;
    }
    try {
      await financeApi.createDemandeDecaissement(selectedIds);
      toast.success("Demande de décaissement créée !");
      setSelectedIds([]);
      fetchDemandes();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Créer une demande de décaissement</h1>
      <Button className="mb-4" onClick={handleCreateDecaissement} disabled={!selectedIds.length}>
        Créer la demande
      </Button>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sélection</TableHead>
              <TableHead>Description / Numéro</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map(d => (
              <TableRow key={d.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(d.id)}
                    onChange={() => toggleSelect(d.id)}
                  />
                </TableCell>
                <TableCell>{d.description} {d.numero ? `(${d.numero})` : ""}</TableCell>
                <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                <TableCell>
                  <span className={badgeColor(d.statut)}>{d.statut}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default DemandesDecaissementPage;
