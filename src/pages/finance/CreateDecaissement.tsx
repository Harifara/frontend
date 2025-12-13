import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

/* ---------------- TYPES ---------------- */

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

/* ---------------- BADGE ---------------- */

const badgeColor = (status: string) => {
  switch (status) {
    case "brouillon":
      return "bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs";
    case "en_attente_coordonnateur":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs";
    case "approuve":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs";
    default:
      return "bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs";
  }
};

/* ---------------- COMPONENT ---------------- */

export default function DemandesDecaissement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  const [rhDemandes, setRhDemandes] = useState<DemandeRH[]>([]);
  const [stockDemandes, setStockDemandes] = useState<DemandeStock[]>([]);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);

  const [selectedRH, setSelectedRH] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- FETCH ---------------- */

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rh, stock, dec] = await Promise.all([
        rhApi.getDemandesRH(),
        stockApi.getDemandesAchat(),
        financeApi.getDecaissements(),
      ]);

      setRhDemandes(rh.results || rh);
      setStockDemandes(stock.results || stock);
      setDecaissements(dec.results || dec);

    } catch (e) {
      toast({ title: "Erreur", description: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ---------------- CALCUL ---------------- */

  const montantTotal =
    rhDemandes
      .filter(d => selectedRH.includes(d.id))
      .reduce((a, b) => a + Number(b.montant), 0)
    +
    stockDemandes
      .filter(d => selectedStock.includes(d.id))
      .reduce((a, b) => a + Number(b.montant_estime), 0);

  /* ---------------- ACTIONS ---------------- */

  const creerDecaissement = async () => {
    if (!selectedRH.length && !selectedStock.length) {
      return toast({ title: "Erreur", description: "Sélectionnez au moins une demande", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await financeApi.createDecaissement({
        demandes_rh_ids: selectedRH,
        demandes_stock_ids: selectedStock,
        montant_total: montantTotal,
        cree_par_id: user?.id,
      });

      toast({ title: "Succès", description: "Décaissement créé (brouillon)" });
      setSelectedRH([]);
      setSelectedStock([]);
      fetchData();

    } catch {
      toast({ title: "Erreur", description: "Création échouée", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const soumettre = async (id: string) => {
    try {
      await financeApi.updateDecaissement(id, { statut: "en_attente_coordonnateur" });
      toast({ title: "Envoyé", description: "Envoyé au coordonnateur" });
      fetchData();
    } catch {
      toast({ title: "Erreur", description: "Soumission échouée", variant: "destructive" });
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-6">

      <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>

      {/* ---------- LISTE RH ---------- */}
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
                    <Checkbox
                      checked={selectedRH.includes(d.id)}
                      onCheckedChange={() =>
                        setSelectedRH(prev =>
                          prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{d.description}</TableCell>
                  <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={badgeColor(d.status)}>{d.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---------- LISTE STOCK ---------- */}
      <Card>
        <CardHeader><CardTitle>Demandes Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant estimé</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStock.includes(d.id)}
                      onCheckedChange={() =>
                        setSelectedStock(prev =>
                          prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{d.numero}</TableCell>
                  <TableCell>{d.montant_estime.toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={badgeColor(d.statut)}>{d.statut}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---------- ACTION ---------- */}
      <div className="flex justify-between items-center">
        <p className="font-bold">Montant total : {montantTotal.toLocaleString()} Ar</p>
        <Button onClick={creerDecaissement} disabled={submitting}>
          {submitting ? "Création..." : "Créer le décaissement"}
        </Button>
      </div>

      {/* ---------- BROUILLONS ---------- */}
      <Card>
        <CardHeader><CardTitle>Décaissements Brouillon</CardTitle></CardHeader>
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
                  <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
                  <TableCell>
                    <span className={badgeColor(d.statut)}>{d.statut}</span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => soumettre(d.id)}>
                      Soumettre
                    </Button>
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
