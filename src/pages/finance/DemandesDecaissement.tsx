// src/pages/finance/DecaissementsPage.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ------------------
// Types
// ------------------
interface Demande {
  id: string;
  source: "RH" | "Stock";
  description: string;
  montant: number;
  status: string;
}

// ------------------
// Badge couleur
// ------------------
const badgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approuve":
    case "valide":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

// ------------------
// Composant
// ------------------
const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDemandes, setSelectedDemandes] = useState<string[]>([]);
  const [detailsDemande, setDetailsDemande] = useState<Demande | null>(null);
  const { toast } = useToast();

  // -----------------
  // Fetch demandes RH + Stock
  // -----------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rhRes, stockRes] = await Promise.all([rhApi.getDemandes(), stockApi.getDemandesAchat()]);

      const rhDemandes: Demande[] = (rhRes.results || rhRes).map((d: any) => ({
        id: d.id,
        source: "RH",
        description: d.description,
        montant: d.montant_total || 0,
        status: d.status || "en_attente",
      }));

      const stockDemandes: Demande[] = (stockRes.results || stockRes).map((d: any) => ({
        id: d.id,
        source: "Stock",
        description: d.article?.nom || d.numero || "-",
        montant: d.montant_estime || 0,
        status: d.statut || "en_attente",
      }));

      setDemandes([...rhDemandes, ...stockDemandes]);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -----------------
  // Créer un décaissement avec les demandes sélectionnées
  // -----------------
  const handleCreateDecaissement = async () => {
    if (!selectedDemandes.length) {
      toast({ title: "Sélection requise", description: "Veuillez sélectionner au moins une demande.", variant: "destructive" });
      return;
    }
    try {
      await financeApi.createDemandeDecaissement({
        created_by: userId,
        demande_ids: selectedDemandes,
      });
      toast({ title: "Succès", description: "Décaissement créé avec succès.", variant: "success" });
      setSelectedDemandes([]);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de créer le décaissement.", variant: "destructive" });
    }
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements</h1>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleCreateDecaissement} disabled={!selectedDemandes.length}>
          Créer un décaissement avec les demandes sélectionnées
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sélection</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.length ? (
                demandes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDemandes.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDemandes((prev) => [...prev, d.id]);
                          else setSelectedDemandes((prev) => prev.filter((id) => id !== d.id));
                        }}
                      />
                    </TableCell>
                    <TableCell>{d.description}</TableCell>
                    <TableCell>{d.source}</TableCell>
                    <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                    <TableCell><span className={badgeColor(d.status)}>{d.status}</span></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setDetailsDemande(d)}>Voir</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Aucune demande disponible.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* -------------------- */}
      {/* Modal détails de la demande */}
      {/* -------------------- */}
      <Dialog open={!!detailsDemande} onOpenChange={() => setDetailsDemande(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Détails de la demande</DialogTitle></DialogHeader>
          {detailsDemande && (
            <div className="space-y-4">
              <p><strong>Description:</strong> {detailsDemande.description}</p>
              <p><strong>Source:</strong> {detailsDemande.source}</p>
              <p><strong>Montant:</strong> {detailsDemande.montant.toLocaleString()} Ar</p>
              <p><strong>Status:</strong> <span className={badgeColor(detailsDemande.status)}>{detailsDemande.status}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDemande(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
