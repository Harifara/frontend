// src/pages/finance/Decaissements.tsx
import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// -------------------------
// Interfaces
// -------------------------
interface DepenseItem {
  id: string;
  description: string;
  montant: number;
  statut: string;
}

interface Decaissement {
  id: string;
  source_service: string;
  created_by: string;
  date_creation: string;
  total_montant: number;
  statut: string;
  depenses: DepenseItem[];
}

const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "valide":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "non_envoyee":
      return "bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDecaissement, setSelectedDecaissement] = useState<Decaissement | null>(null);
  const { toast } = useToast();

  // ---------------- Fetch décaissements ----------------
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDecaissements();
      const data = await res.json();
      setDecaissements(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecaissements(); }, []);

  // ---------------- Actions ----------------
  const handleValider = async (dec: Decaissement) => {
    try {
      await financeApi.updateDecaissement(dec.id, { statut: "valide" });
      toast({ title: "Succès", description: "Décaissement approuvé." });
      fetchDecaissements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible d'approuver.", variant: "destructive" });
    }
  };

  const handleRejeter = async (dec: Decaissement) => {
    if (!confirm("Voulez-vous vraiment rejeter ce décaissement ?")) return;
    try {
      await financeApi.updateDecaissement(dec.id, { statut: "rejete" });
      toast({ title: "Succès", description: "Décaissement rejeté." });
      fetchDecaissements();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de rejeter.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements (Tous Services)</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Dépenses</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {decaissements.length ? decaissements.map(d => (
            <TableRow key={d.id}>
              <TableCell>{d.source_service}</TableCell>
              <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
              <TableCell>{d.total_montant.toLocaleString()} Ar</TableCell>
              <TableCell>
                <span className={badgeColor(d.statut)}>{d.statut}</span>
              </TableCell>

              {/* Détails des dépenses */}
              <TableCell>
                <ul className="ml-2 list-disc">
                  {d.depenses.map(dep => (
                    <li key={dep.id}>
                      {dep.description} - {dep.montant.toLocaleString()} Ar
                      {" "}
                      <span className={badgeColor(dep.statut)}>{dep.statut}</span>
                    </li>
                  ))}
                </ul>
              </TableCell>

              {/* Actions finance */}
              <TableCell className="space-x-2">
                {d.statut === "en_attente" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleValider(d)}>Approuver</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejeter(d)}>Rejeter</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">Aucun décaissement trouvé.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DecaissementsPage;
