// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState, useMemo } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Demande {
  id: string;
  description?: string;
  numero?: string;
  montant: number;
  statut: string;
  source: "RH" | "Stock";
}

interface Decaissement {
  id: string;
  reference: string;
  statut: string;
  montant_total: number;
  demandes_rh_ids?: string[];
  demandes_stock_ids?: string[];
}

const STATUS_BADGES: Record<string, string> = {
  brouillon: "bg-gray-200 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-100 text-yellow-800",
  approuve: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
};

export default function DemandesDecaissement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"recues" | "brouillons">("recues");

  // 🔹 Fetch data et filtrage des demandes déjà utilisées
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rh, stock, dec] = await Promise.all([
        rhApi.getDemandesRH(),
        stockApi.getDemandesAchat(),
        financeApi.getDecaissements(),
      ]);

      // 🔹 Récupérer toutes les demandes déjà utilisées
      const usedRhIds = dec.reduce<string[]>((acc, d) => [...acc, ...(d.demandes_rh_ids || [])], []);
      const usedStockIds = dec.reduce<string[]>((acc, d) => [...acc, ...(d.demandes_stock_ids || [])], []);

      // 🔹 Combiner et filtrer les demandes déjà utilisées
      const combinedDemandes: Demande[] = [
        ...rh.map(d => ({ ...d, montant: Number(d.montant), source: "RH" as const })),
        ...stock.map(d => ({ ...d, montant: Number(d.montant_estime), source: "Stock" as const })),
      ].filter(d => !usedRhIds.includes(d.id) && !usedStockIds.includes(d.id));

      setDemandes(combinedDemandes);
      setDecaissements(dec);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Toggle sélection
  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

  // 🔹 Calcul du montant total sélectionné
  const totalSelection = useMemo(() => {
    return demandes
      .filter(d => selected.includes(d.id))
      .reduce((sum, d) => sum + Number(d.montant || 0), 0);
  }, [selected, demandes]);

  // 🔹 Créer un décaissement
  const creerDecaissement = async () => {
    if (!selected.length) {
      return toast({ title: "Erreur", description: "Sélectionnez au moins une demande", variant: "destructive" });
    }
    setSubmitting(true);
    try {
      const demandes_rh_ids = demandes.filter(d => selected.includes(d.id) && d.source === "RH").map(d => d.id);
      const demandes_stock_ids = demandes.filter(d => selected.includes(d.id) && d.source === "Stock").map(d => d.id);

      const newDec = await financeApi.createDecaissement({ demandes_rh_ids, demandes_stock_ids });

      // 🔹 Ajouter le décaissement avec le montant correct
      setDecaissements(prev => [...prev, { ...newDec, montant_total: totalSelection, demandes_rh_ids, demandes_stock_ids }]);

      // 🔹 Retirer les demandes sélectionnées
      setDemandes(prev => prev.filter(d => !selected.includes(d.id)));

      // 🔹 Réinitialiser la sélection
      setSelected([]);

      toast({ title: "Succès", description: "Décaissement créé (brouillon)" });
    } catch {
      toast({ title: "Erreur", description: "Création échouée", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 Soumettre un décaissement
  const soumettre = async (id: string) => {
    try {
      await financeApi.soumettreDecaissement(id);
      await fetchData(); // Rafraîchir la liste
      toast({ title: "Envoyé", description: "Envoyé au coordonnateur" });
    } catch {
      toast({ title: "Erreur", description: "Soumission échouée", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>

      {/* Toggle view */}
      <div className="space-x-2 mb-4">
        <Button onClick={() => setView("recues")} variant={view === "recues" ? "default" : "outline"}>Voir demandes reçues</Button>
        <Button onClick={() => setView("brouillons")} variant={view === "brouillons" ? "default" : "outline"}>Voir demandes à soumettre</Button>
      </div>

      {view === "recues" && (
        <Card>
          <CardHeader><CardTitle>Demandes reçues</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Description / Numéro</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Checkbox checked={selected.includes(d.id)} onCheckedChange={() => toggle(d.id)} />
                    </TableCell>
                    <TableCell>{d.description || d.numero}</TableCell>
                    <TableCell>{Number(d.montant).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar</TableCell>
                    <TableCell>{d.source}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"}`}>{d.statut}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Montant total sélection */}
            <div className="flex justify-between items-center mt-4">
              <p className="font-bold">
                Montant total sélection : {totalSelection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar
              </p>
              <Button onClick={creerDecaissement} disabled={submitting}>
                {submitting ? "Création..." : "Créer le décaissement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "brouillons" && (
        <Card>
          <CardHeader><CardTitle>Brouillons</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decaissements.filter(d => d.statut === "brouillon").map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.reference}</TableCell>
                    <TableCell>{Number(d.montant_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"}`}>{d.statut}</span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => soumettre(d.id)}>Soumettre</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
