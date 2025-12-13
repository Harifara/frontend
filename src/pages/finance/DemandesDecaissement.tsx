// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi, authApi } from "@/lib/api";
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
// Badge couleur selon statut
// -----------------------------
const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "brouillon": return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente_coordo": return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "validé": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "payé": return "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

// -----------------------------
// Composant principal
// -----------------------------
export default function DemandesDecaissement() {
  const [user, setUser] = useState<any>(null);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [demandesRH, setDemandesRH] = useState<DemandeRH[]>([]);
  const [demandesStock, setDemandesStock] = useState<DemandeAchat[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null);
  const [depenseDescription, setDepenseDescription] = useState("");
  const [depenseMontant, setDepenseMontant] = useState(0);

  // -----------------------------
  // Récupération utilisateur
  // -----------------------------
  const fetchUser = async () => {
    try {
      const u = await stockApi.me();
      setUser(u);
    } catch (err: any) {
      console.error("Impossible de récupérer l'utilisateur connecté :", err.message);
      alert("Vous devez vous reconnecter.");
    }
  };

  // -----------------------------
  // Chargement des données
  // -----------------------------
  const fetchData = async () => {
    try {
      const [dec, rh, stock] = await Promise.all([
        financeApi.getDecaissements(),
        rhApi.getDemandes(),
        stockApi.getDemandesAchat(),
      ]);
      setDecaissements(dec);
      setDemandesRH(rh);
      setDemandesStock(stock);
    } catch (err: any) {
      console.error("Erreur lors du chargement des données :", err.message);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  // -----------------------------
  // Création d'un décaissement
  // -----------------------------
  const createDecaissement = async (source_type: "RH" | "Stock", source_id: string, montant: number) => {
    try {
      await financeApi.createDecaissement({
        source_type,
        source_id,
        total_montant: montant,
        depenses: [{ description: depenseDescription, montant }],
      });
      setDialogOpen(false);
      setDepenseDescription("");
      setDepenseMontant(0);
      fetchData(); // refresh
    } catch (err: any) {
      console.error("Erreur lors de la création du décaissement :", err.message);
      alert("Impossible de créer le décaissement.");
    }
  };

  // -----------------------------
  // Rendu
  // -----------------------------
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Demandes de Décaissement</h1>

      {/* Liste des décaissements */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date création</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decaissements.map((dec) => (
            <TableRow key={dec.id}>
              <TableCell>{dec.source_service}</TableCell>
              <TableCell>{dec.source_type}</TableCell>
              <TableCell>{new Date(dec.date_creation).toLocaleDateString()}</TableCell>
              <TableCell>{dec.total_montant.toLocaleString()}</TableCell>
              <TableCell><span className={badgeColor(dec.statut)}>{dec.statut}</span></TableCell>
              <TableCell>
                <Button onClick={() => setDialogOpen(true) || setSelectedDemandeId(dec.id)}>Ajouter dépense</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog création dépense */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Description"
              value={depenseDescription}
              onChange={(e) => setDepenseDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Montant"
              value={depenseMontant}
              onChange={(e) => setDepenseMontant(Number(e.target.value))}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() => {
                if (selectedDemandeId) createDecaissement("RH", selectedDemandeId, depenseMontant);
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liste des demandes RH et Stock pour info */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold mb-2">Demandes RH</h2>
          <ul className="list-disc pl-5">
            {demandesRH.map((d) => (
              <li key={d.id}>{d.description} - {d.montant.toLocaleString()} Ar</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold mb-2">Demandes Stock</h2>
          <ul className="list-disc pl-5">
            {demandesStock.map((d) => (
              <li key={d.id}>{d.article_nom} x {d.quantite} - {d.montant_estime.toLocaleString()} Ar</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
