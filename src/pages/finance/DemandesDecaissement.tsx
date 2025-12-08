// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/api";

type ValidationDetail = {
  id: string;
  numero: string;
  description: string;
  montant: number;
  statut: string;
  decaissement_cree: boolean;
  cordo_valide: boolean;
};

const badgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approuve": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "decaisse": return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    case "cordo_valide": return "bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DemandesDecaissementPage: React.FC = () => {
  const [demandes, setDemandes] = useState<ValidationDetail[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchValidations = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getValidations();

      const list = Array.isArray(res?.results) ? res.results : [];

      const validations: ValidationDetail[] = list.map((v: any) => ({
        id: v.id,
        numero: v.numero,
        description: v.description,
        montant: Number(v.montant),
        statut: v.statut?.toLowerCase(),
        decaissement_cree: Boolean(v.decaissement_cree),
        cordo_valide: Boolean(v.cordo_valide),
      }));

      // Garder seulement les approuvés ou déjà en décaissement
      setDemandes(
        validations.filter(v => v.statut === "approuve" || v.decaissement_cree)
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateDecaissement = async () => {
    if (!selectedIds.length) return toast.error("Sélectionnez au moins une demande !");
    try {
      await financeApi.createDemandeDecaissement(selectedIds);
      toast.success("Décaissement créé !");
      setSelectedIds([]);
      fetchValidations();
    } catch (err: any) {
      toast.error(err.message || "Erreur création décaissement");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Demandes de décaissement</h1>

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
              <TableHead>Description</TableHead>
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
                    disabled={d.decaissement_cree}
                  />
                </TableCell>

                <TableCell>
                  <strong>{d.numero}</strong> — {d.description}
                  <div className="mt-1 space-x-2">
                    {d.decaissement_cree && (
                      <span className={badgeColor("decaisse")}>Décaissement créé</span>
                    )}
                    {d.cordo_valide && (
                      <span className={badgeColor("cordo_valide")}>Cordo validé</span>
                    )}
                  </div>
                </TableCell>

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
