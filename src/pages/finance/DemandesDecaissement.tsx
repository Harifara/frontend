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
    case "brouillon":
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente_coordo":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "validé":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "payé":
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs font-semibold";
  }
};

// -----------------------------
// Composant principal
// -----------------------------
export default function DemandesDecaissement() {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesStock, setDemandesStock] = useState<DemandeAchat[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandeRH | DemandeAchat | null>(null);
  const [sourceType, setSourceType] = useState<"RH" | "Stock">("RH");

  // -----------------------------
  // Récupération des données
  // -----------------------------
  const fetchDecaissements = async () => {
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDemandes = async () => {
    try {
      const rh = await rhApi.getDemandes();
      setDemandesRH(rh);
      const stock = await stockApi.getDemandesAchat();
      setDemandesStock(stock);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDecaissements();
    fetchDemandes();
  }, []);

  // -----------------------------
  // Création d'un décaissement
  // -----------------------------
  const handleCreateDecaissement = async () => {
    if (!selectedDemande) return;
    try {
      const payload =
        sourceType === "RH"
          ? {
              source_service: "RH",
              source_type: "RH",
              source_id: selectedDemande.id,
              total_montant: (selectedDemande as DemandeRH).montant,
            }
          : {
              source_service: "Stock",
              source_type: "Stock",
              source_id: selectedDemande.id,
              total_montant: (selectedDemande as DemandeAchat).montant_estime,
            };
      await financeApi.createDecaissement(payload);
      setOpenDialog(false);
      setSelectedDemande(null);
      fetchDecaissements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Demandes de Décaissement</h1>
      <Button onClick={() => setOpenDialog(true)}>Nouvelle Demande</Button>

      {/* Table des décaissements */}
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total Montant</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.id}</TableCell>
              <TableCell>{d.source_type}</TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleDateString()}</TableCell>
              <TableCell>{d.total_montant.toLocaleString()}</TableCell>
              <TableCell>
                <span className={badgeColor(d.statut)}>{d.statut}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog de création */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau décaissement</DialogTitle>
          </DialogHeader>

          <div className="flex space-x-2 mb-4">
            <Button
              variant={sourceType === "RH" ? "default" : "outline"}
              onClick={() => setSourceType("RH")}
            >
              RH
            </Button>
            <Button
              variant={sourceType === "Stock" ? "default" : "outline"}
              onClick={() => setSourceType("Stock")}
            >
              Stock
            </Button>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Sélectionner la demande</label>
            <select
              className="w-full border rounded p-2"
              value={selectedDemande?.id || ""}
              onChange={(e) => {
                const id = e.target.value;
                if (sourceType === "RH") {
                  setSelectedDemande(demandesRH.find((d) => d.id === id) || null);
                } else {
                  setSelectedDemande(demandesStock.find((d) => d.id === id) || null);
                }
              }}
            >
              <option value="">-- Choisir --</option>
              {(sourceType === "RH" ? demandesRH : demandesStock).map((d) => (
                <option key={d.id} value={d.id}>
                  {sourceType === "RH" ? `${d.description} - ${d.montant}` : `${d.article_nom} - ${d.montant_estime}`}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateDecaissement}>Créer</Button>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
