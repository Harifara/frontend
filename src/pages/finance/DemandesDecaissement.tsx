// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// -----------------------------
// Types
// -----------------------------
interface Depense {
  id: string;
  description: string;
  montant: number;
  statut: string;
}

interface Decaissement {
  id: string;
  source_service: string;
  source_type: "RH" | "Stock";
  source_id: string;
  date_creation: string;
  total_montant: number;
  statut: "brouillon" | "en_attente_coordo" | "validé" | "payé";
  depenses: Depense[];
}

interface DemandeRH {
  id: string;
  description: string;
  montant: number;
  status: string;
}

interface DemandeAchat {
  id: string;
  article_nom: string;
  quantite: number;
  montant_estime: number;
  statut: string;
}

// -----------------------------
// Couleur badge selon statut
// -----------------------------
const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "brouillon": return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente_coordo": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "validé": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "payé": return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-semibold";
  }
};

// -----------------------------
// Composant principal
// -----------------------------
const DemandesDecaissement: React.FC = () => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesAchat, setDemandesAchat] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecaissement, setSelectedDecaissement] = useState<Decaissement | null>(null);
  const [newDepenseDesc, setNewDepenseDesc] = useState("");
  const [newDepenseMontant, setNewDepenseMontant] = useState<number | "">(0);
  const [error, setError] = useState("");

  // -----------------------------
  // Charger toutes les données
  // -----------------------------
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [decaissementsRes, rhRes, stockRes] = await Promise.all([
        financeApi.getDecaissements(),
        rhApi.getDemandes(),
        stockApi.getDemandesAchat(),
      ]);

      setDecaissements(decaissementsRes);
      setDemandesRH(rhRes.results || rhRes);
      setDemandesAchat(stockRes.results || stockRes);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // -----------------------------
  // Créer un décaissement à partir d'une demande
  // -----------------------------
  const handleCreateDecaissement = async (
    source_type: "RH" | "Stock",
    source_id: string,
    montant: number
  ) => {
    try {
      await financeApi.createDecaissement({ 
        source_service: source_type, 
        source_id, 
        total_montant: montant 
      });
      fetchAll();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la création du décaissement.");
    }
  };

  // -----------------------------
  // Envoyer un décaissement au coordonnateur
  // -----------------------------
  const handleEnvoyerCoordo = async (decaissementId: string) => {
    if (!confirm("Envoyer ce décaissement au coordonnateur ?")) return;
    try {
      await financeApi.envoyerAuCoordonnateur(decaissementId); // API à créer côté backend
      fetchAll();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'envoi au coordonnateur.");
    }
  };

  // -----------------------------
  // Ajouter une dépense
  // -----------------------------
  const handleAddDepense = async () => {
    if (!selectedDecaissement) return;
    if (!newDepenseDesc || !newDepenseMontant) {
      setError("Veuillez saisir la description et le montant.");
      return;
    }

    try {
      await financeApi.createDepense({
        demande: selectedDecaissement.id,
        description: newDepenseDesc,
        montant: newDepenseMontant,
      });
      setNewDepenseDesc("");
      setNewDepenseMontant(0);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'ajout de la dépense.");
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Demandes de Décaissement</h1>
      {error && <p className="text-red-600">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description / Article</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Demandes RH */}
          {demandesRH.map(d => (
            <TableRow key={`rh-${d.id}`}>
              <TableCell>RH</TableCell>
              <TableCell>{d.description}</TableCell>
              <TableCell>{d.montant.toLocaleString()}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Button onClick={() => handleCreateDecaissement("RH", d.id, d.montant)}>
                  Créer Décaissement
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {/* Demandes Stock */}
          {demandesAchat.map(d => (
            <TableRow key={`stock-${d.id}`}>
              <TableCell>Stock</TableCell>
              <TableCell>{d.article_nom} x {d.quantite}</TableCell>
              <TableCell>{d.montant_estime.toLocaleString()}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>
                <Button onClick={() => handleCreateDecaissement("Stock", d.id, d.montant_estime)}>
                  Créer Décaissement
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {/* Décaissements existants */}
          {decaissements.map(d => (
            <TableRow key={`dec-${d.id}`}>
              <TableCell>{d.source_service}</TableCell>
              <TableCell>ID Source: {d.source_id}</TableCell>
              <TableCell>{d.total_montant.toLocaleString()}</TableCell>
              <TableCell><span className={badgeColor(d.statut)}>{d.statut}</span></TableCell>
              <TableCell className="space-x-2">
                <Button onClick={() => setSelectedDecaissement(d)}>Voir / Ajouter Dépense</Button>
                {d.statut === "brouillon" && (
                  <Button variant="outline" onClick={() => handleEnvoyerCoordo(d.id)}>
                    Envoyer au Coordonnateur
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog pour gérer les dépenses */}
      <Dialog open={!!selectedDecaissement} onOpenChange={() => setSelectedDecaissement(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dépenses du décaissement</DialogTitle>
          </DialogHeader>

          {selectedDecaissement && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDecaissement.depenses.map(dep => (
                    <TableRow key={dep.id}>
                      <TableCell>{dep.description}</TableCell>
                      <TableCell>{dep.montant.toLocaleString()}</TableCell>
                      <TableCell>{dep.statut}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Description"
                  value={newDepenseDesc}
                  onChange={(e) => setNewDepenseDesc(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Montant"
                  value={newDepenseMontant}
                  onChange={(e) => setNewDepenseMontant(parseFloat(e.target.value))}
                />
                <Button
                  disabled={!newDepenseDesc || !newDepenseMontant}
                  onClick={handleAddDepense}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedDecaissement(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;
