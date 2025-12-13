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

/* ================== TYPES ================== */

interface Achat {
  id: string;
  article: string;
  nombre: number;
  montant: number;
}

interface Payement {
  id: string;
  montant: number;
}

interface DemandeRH {
  id: string;
  description: string;
  montant: number;
  status: string;
  achats?: Achat[];
  payements?: Payement[];
}

interface Article {
  id: string;
  nom: string;
}

interface DemandeStock {
  id: string;
  numero: string;
  article?: Article | null;
  quantite: number;
  montant_estime: number;
  justification: string;
  statut: string;
}

interface Decaissement {
  id: string;
  reference: string;
  statut: string;
  montant_total: number;
}

/* ================== UTILS ================== */

const badge = (status: string) => {
  const map: any = {
    brouillon: "bg-gray-200 text-gray-800",
    en_attente_coordonnateur: "bg-yellow-100 text-yellow-800",
    approuve: "bg-green-100 text-green-800",
    rejete: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100";
};

/* ================== COMPONENT ================== */

export default function DemandesDecaissement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<"creation" | "soumission">("creation");

  const [loading, setLoading] = useState(true);
  const [rhDemandes, setRhDemandes] = useState<DemandeRH[]>([]);
  const [stockDemandes, setStockDemandes] = useState<DemandeStock[]>([]);
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);

  const [selectedRH, setSelectedRH] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /* ================== FETCH ================== */

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

    } catch {
      toast({ title: "Erreur", description: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ================== CALCUL ================== */

  const total =
    rhDemandes.filter(d => selectedRH.includes(d.id)).reduce((a, b) => a + b.montant, 0) +
    stockDemandes.filter(d => selectedStock.includes(d.id)).reduce((a, b) => a + b.montant_estime, 0);

  /* ================== ACTIONS ================== */

  const creerDecaissement = async () => {
    if (!selectedRH.length && !selectedStock.length) {
      return toast({ title: "Erreur", description: "Sélectionnez au moins une demande", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      await financeApi.createDecaissement({
        demandes_rh_ids: selectedRH,
        demandes_stock_ids: selectedStock,
        montant_total: total,
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
    await financeApi.updateDecaissement(id, { statut: "en_attente_coordonnateur" });
    toast({ title: "Envoyé", description: "Envoyé au coordonnateur" });
    fetchData();
  };

  /* ================== RENDER ================== */

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-6">

      {/* ================== HEADER ================== */}
      <div className="flex gap-4">
        <Button variant={view === "creation" ? "default" : "outline"} onClick={() => setView("creation")}>
          Voir demandes reçues
        </Button>
        <Button variant={view === "soumission" ? "default" : "outline"} onClick={() => setView("soumission")}>
          Voir soumissions à faire
        </Button>
      </div>

      {/* ================== VUE CREATION ================== */}
      {view === "creation" && (
        <>
          {/* ---------- RH ---------- */}
          <Card>
            <CardHeader><CardTitle>Demandes RH</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Description</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rhDemandes.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRH.includes(d.id)}
                          onCheckedChange={() =>
                            setSelectedRH(p => p.includes(d.id) ? p.filter(i => i !== d.id) : [...p, d.id])
                          }
                        />
                      </TableCell>
                      <TableCell>{d.description}</TableCell>
                      <TableCell>
                        <ul className="list-disc ml-4">
                          {d.achats?.map(a => (
                            <li key={a.id}>{a.article} × {a.nombre} = {a.montant} Ar</li>
                          ))}
                          {d.payements?.map(p => (
                            <li key={p.id}>Paiement : {p.montant} Ar</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ---------- STOCK ---------- */}
          <Card>
            <CardHeader><CardTitle>Demandes Stock</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Numéro</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockDemandes.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStock.includes(d.id)}
                          onCheckedChange={() =>
                            setSelectedStock(p => p.includes(d.id) ? p.filter(i => i !== d.id) : [...p, d.id])
                          }
                        />
                      </TableCell>
                      <TableCell>{d.numero}</TableCell>
                      <TableCell>
                        <p>Article : {d.article?.nom || "-"}</p>
                        <p>Quantité : {d.quantite}</p>
                        <p>Justification : {d.justification}</p>
                      </TableCell>
                      <TableCell>{d.montant_estime.toLocaleString()} Ar</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <strong>Montant total : {total.toLocaleString()} Ar</strong>
            <Button onClick={creerDecaissement} disabled={submitting}>
              Créer le décaissement
            </Button>
          </div>
        </>
      )}

      {/* ================== VUE SOUMISSION ================== */}
      {view === "soumission" && (
        <Card>
          <CardHeader><CardTitle>Décaissements à soumettre</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decaissements.filter(d => d.statut === "brouillon").map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.reference}</TableCell>
                    <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
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
