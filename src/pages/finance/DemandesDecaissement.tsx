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

/* ---------------- TYPES ---------------- */
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

/* ---------------- CONSTANTES ---------------- */
const STATUS_BADGES: Record<string, string> = {
  brouillon: "bg-gray-200 text-gray-800",
  en_attente_coordonnateur: "bg-yellow-100 text-yellow-800",
  approuve: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
};

/* ---------------- COMPONENTS TABLE ---------------- */
const RHTable = ({ demandes, selected, toggle }: { demandes: DemandeRH[]; selected: string[]; toggle: (id: string) => void }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead></TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Détails</TableHead>
        <TableHead>Montant</TableHead>
        <TableHead>Statut</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {demandes.map(d => (
        <TableRow key={d.id}>
          <TableCell>
            <Checkbox
              checked={selected.includes(d.id)}
              onCheckedChange={() => toggle(d.id)}
            />
          </TableCell>
          <TableCell>{d.description}</TableCell>
          <TableCell>
            <strong>Achats :</strong>
            <ul className="list-disc ml-4">
              {d.achats?.map(a => (
                <li key={a.id}>{a.article} - {a.nombre} × {a.montant} Ar</li>
              )) || "—"}
            </ul>
            <strong>Paiements :</strong>
            <ul className="list-disc ml-4">
              {d.payements?.map(p => <li key={p.id}>{p.montant} Ar</li>) || "—"}
            </ul>
          </TableCell>
          <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
          <TableCell>
            <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.status] || "bg-gray-100 text-gray-700"}`}>
              {d.status}
            </span>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const StockTable = ({ demandes, selected, toggle }: { demandes: DemandeStock[]; selected: string[]; toggle: (id: string) => void }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead></TableHead>
        <TableHead>Numéro</TableHead>
        <TableHead>Détails</TableHead>
        <TableHead>Montant</TableHead>
        <TableHead>Statut</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {demandes.map(d => (
        <TableRow key={d.id}>
          <TableCell>
            <Checkbox
              checked={selected.includes(d.id)}
              onCheckedChange={() => toggle(d.id)}
            />
          </TableCell>
          <TableCell>{d.numero}</TableCell>
          <TableCell>
            <p><strong>Article :</strong> {d.article?.nom || "-"}</p>
            <p><strong>Quantité :</strong> {d.quantite}</p>
            <p><strong>Justification :</strong> {d.justification}</p>
          </TableCell>
          <TableCell>{d.montant_estime.toLocaleString()} Ar</TableCell>
          <TableCell>
            <span className={`px-2 py-1 rounded text-xs ${STATUS_BADGES[d.statut] || "bg-gray-100 text-gray-700"}`}>
              {d.statut}
            </span>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const BrouillonTable = ({ decaissements, soumettre }: { decaissements: Decaissement[]; soumettre: (id: string) => void }) => (
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
      {decaissements.map(d => (
        <TableRow key={d.id}>
          <TableCell>{d.reference}</TableCell>
          <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
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
);

/* ---------------- PAGE PRINCIPALE ---------------- */
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

  useEffect(() => {
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
        toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRH = (id: string) => setSelectedRH(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleStock = (id: string) => setSelectedStock(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const total = useMemo(() => 
    rhDemandes.filter(d => selectedRH.includes(d.id)).reduce((a, b) => a + b.montant, 0) +
    stockDemandes.filter(d => selectedStock.includes(d.id)).reduce((a, b) => a + b.montant_estime, 0)
  , [selectedRH, selectedStock, rhDemandes, stockDemandes]);

  const creerDecaissement = async () => {
    if (!selectedRH.length && !selectedStock.length) {
      return toast({ title: "Erreur", description: "Sélectionnez au moins une demande", variant: "destructive" });
    }

    setSubmitting(true);
    try {
      const newDec = await financeApi.createDecaissement({
        demandes_rh_ids: selectedRH,
        demandes_stock_ids: selectedStock,
        montant_total: total,
        cree_par_id: user?.id,
      });
      setDecaissements(prev => [...prev, newDec]);
      setSelectedRH([]);
      setSelectedStock([]);
      toast({ title: "Succès", description: "Décaissement créé (brouillon)" });
    } catch {
      toast({ title: "Erreur", description: "Création échouée", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const soumettre = async (id: string) => {
    try {
      await financeApi.updateDecaissement(id, { statut: "en_attente_coordonnateur" });
      setDecaissements(prev => prev.map(d => d.id === id ? { ...d, statut: "en_attente_coordonnateur" } : d));
      toast({ title: "Envoyé", description: "Envoyé au coordonnateur" });
    } catch {
      toast({ title: "Erreur", description: "Soumission échouée", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>

      <Card>
        <CardHeader><CardTitle>Demandes RH (détails)</CardTitle></CardHeader>
        <CardContent>
          <RHTable demandes={rhDemandes} selected={selectedRH} toggle={toggleRH} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Demandes Stock (détails)</CardTitle></CardHeader>
        <CardContent>
          <StockTable demandes={stockDemandes} selected={selectedStock} toggle={toggleStock} />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="font-bold">Montant total : {total.toLocaleString()} Ar</p>
        <Button onClick={creerDecaissement} disabled={submitting}>
          {submitting ? "Création..." : "Créer le décaissement"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Brouillons</CardTitle></CardHeader>
        <CardContent>
          <BrouillonTable decaissements={decaissements.filter(d => d.statut === "brouillon")} soumettre={soumettre} />
        </CardContent>
      </Card>
    </div>
  );
}
