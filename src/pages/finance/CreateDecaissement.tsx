// src/pages/finance/DemandesDecaissement.tsx
import React, { useEffect, useState, useMemo } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemandeRH {
  id: string;
  description: string;
  montant: number;
  status: string;
}

interface DemandeStock {
  id: string;
  numero: string;
  montant_estime: number;
  statut: string;
}

interface Decaissement {
  id: string;
  reference: string;
  statut: string;
  montant_total: number;
  demandes_rh_ids: string[];
  demandes_stock_ids: string[];
}

const STATUS_BADGES: Record<string, string> = {
  brouillon: "bg-gray-200 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-100 text-yellow-800",
  approuve: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
  en_cours: "bg-blue-100 text-blue-800",
};

export default function DemandesDecaissement() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rhDemandes, setRhDemandes] = useState<DemandeRH[]>([]);
  const [stockDemandes, setStockDemandes] = useState<DemandeStock[]>([]);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [selectedRH, setSelectedRH] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [failedRH, setFailedRH] = useState<string[]>([]);
  const [failedStock, setFailedStock] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rh, stock, dec] = await Promise.all([
        rhApi.getDemandesRH(),
        stockApi.getDemandesAchat(),
        financeApi.getDecaissements(),
      ]);
      setRhDemandes(rh);
      setStockDemandes(stock);
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

  const toggleRH = (id: string) =>
    setSelectedRH(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

  const toggleStock = (id: string) =>
    setSelectedStock(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

  // ---------------------- Calcul total sélection ----------------------
  const totalSelection = useMemo(() => {
    const totalRH = selectedRH
      .map(id => Number(rhDemandes.find(d => d.id === id)?.montant ?? 0))
      .reduce((sum, val) => sum + val, 0);

    const totalStock = selectedStock
      .map(id => Number(stockDemandes.find(d => d.id === id)?.montant_estime ?? 0))
      .reduce((sum, val) => sum + val, 0);

    return totalRH + totalStock;
  }, [selectedRH, selectedStock, rhDemandes, stockDemandes]);

  // ---------------------- Création décaissement ----------------------
  const creerDecaissement = async () => {
    if (!selectedRH.length && !selectedStock.length) {
      return toast({ title: "Erreur", description: "Sélectionnez au moins une demande", variant: "destructive" });
    }
    setSubmitting(true);
    try {
      const newDec: Decaissement = await financeApi.createDecaissement({
        demandes_rh_ids: selectedRH,
        demandes_stock_ids: selectedStock,
        montant_total: totalSelection,
      });

      // 🔹 Mettre à jour localement les statuts des demandes sélectionnées
      setRhDemandes(demandes =>
        demandes.map(d => selectedRH.includes(d.id) ? { ...d, status: "en_cours" } : d)
      );
      setStockDemandes(demandes =>
        demandes.map(d => selectedStock.includes(d.id) ? { ...d, statut: "en_cours" } : d)
      );

      const failedRHIds = selectedRH.filter(id => !newDec.demandes_rh_ids.includes(id));
      const failedStockIds = selectedStock.filter(id => !newDec.demandes_stock_ids.includes(id));
      setFailedRH(failedRHIds);
      setFailedStock(failedStockIds);

      await fetchData();
      setSelectedRH([]);
      setSelectedStock([]);
      toast({ title: "Succès", description: "Décaissement créé (brouillon)" });
    } catch {
      toast({ title: "Erreur", description: "Création échouée", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------- Soumission décaissement ----------------------
  const soumettre = async (id: string) => {
    try {
      await financeApi.soumettreDecaissement(id);
      await fetchData();
      toast({ title: "Envoyé", description: "Envoyé au coordonnateur" });
    } catch {
      toast({ title: "Erreur", description: "Soumission échouée", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>

      {(failedRH.length > 0 || failedStock.length > 0) && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          <p>⚠️ Certaines demandes n'ont pas pu être incluses :</p>
          {failedRH.length > 0 && <p>RH : {failedRH.join(", ")}</p>}
          {failedStock.length > 0 && <p>Stock : {failedStock.join(", ")}</p>}
        </div>
      )}

      {/* Demandes RH */}
      <Card>
        <CardHeader><CardTitle>Demandes RH</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rhDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Checkbox checked={selectedRH.includes(d.id)} onCheckedChange={() => toggleRH(d.id)} />
                  </TableCell>
                  <TableCell>{d.description}</TableCell>
                  <TableCell>{Number(d.montant || 0).toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.status] || "bg-gray-100 text-gray-700"}`}>
                      {d.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Demandes Stock */}
      <Card>
        <CardHeader><CardTitle>Demandes Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Checkbox checked={selectedStock.includes(d.id)} onCheckedChange={() => toggleStock(d.id)} />
                  </TableCell>
                  <TableCell>{d.numero}</TableCell>
                  <TableCell>{Number(d.montant_estime || 0).toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"}`}>
                      {d.statut}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Montant total sélection */}
      <div className="flex justify-between items-center">
        <p className="font-bold">Montant total sélection : {totalSelection.toLocaleString()} Ar</p>
        <Button onClick={creerDecaissement} disabled={submitting}>
          {submitting ? "Création..." : "Créer le décaissement"}
        </Button>
      </div>

      {/* Brouillons */}
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
                  <TableCell>{Number(d.montant_total || 0).toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"}`}>
                      {d.statut}
                    </span>
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
    </div>
  );
}
