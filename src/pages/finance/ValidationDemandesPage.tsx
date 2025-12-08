// src/pages/finance/ValidationDemandesPage.tsx
import React, { useEffect, useState } from "react";
import {
  Table, TableHeader, TableBody, TableRow, TableCell, TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/api";

// -----------------
// Types
// -----------------
type ArticleDetail = { nom: string; quantite: number; prix_unitaire: number };
type PaiementDetail = { montant: number };

type ValidationDetail = {
  id: string;
  numero: string;
  description: string;
  montant: number;
  statut: string;
  service_origine: "rh_service" | "stock_service";
  articles?: ArticleDetail[];
  paiements?: PaiementDetail[];
};

const badgeColor = (s: string) => {
  switch (s) {
    case "approuve": return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete": return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    default: return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const ValidationDemandesPage: React.FC = () => {
  const [demandes, setDemandes] = useState<ValidationDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getValidations();

      const list = (res.results || []).map((v: any) => ({
        id: v.id,
        numero: v.numero,
        description: v.description,
        montant: Number(v.montant),
        statut: v.statut,
        service_origine: v.service_origine,
        articles: v.articles || [],
        paiements: v.paiements || [],
      }));

      setDemandes(list);
    } catch (e) {
      toast.error("Erreur chargement.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const valider = async (id: string, action: "approuve" | "rejete") => {
    try {
      await financeApi.validateDemande(id, action);
      toast.success(`Demande ${action}`);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Validation des Demandes</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.description}</TableCell>
                <TableCell>{d.montant.toLocaleString()} Ar</TableCell>

                {/* DETAILS */}
                <TableCell>
                  {d.service_origine === "stock_service" && (
                    <ul className="text-sm list-disc ml-4">
                      {d.articles?.map((a, i) => (
                        <li key={i}>{a.nom} — {a.quantite} × {a.prix_unitaire.toLocaleString()} Ar</li>
                      ))}
                    </ul>
                  )}

                  {d.service_origine === "rh_service" && (
                    <ul className="text-sm list-disc ml-4">
                      {d.paiements?.map((p, i) => (
                        <li key={i}>Paiement : {p.montant.toLocaleString()} Ar</li>
                      ))}
                    </ul>
                  )}
                </TableCell>

                <TableCell>
                  <span className={badgeColor(d.statut)}>{d.statut}</span>
                </TableCell>

                <TableCell>
                  {d.statut === "en_attente" && (
                    <div className="space-x-2">
                      <Button size="sm" onClick={() => valider(d.id, "approuve")}>Approuver</Button>
                      <Button size="sm" variant="destructive" onClick={() => valider(d.id, "rejete")}>
                        Rejeter
                      </Button>
                    </div>
                  )}
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ValidationDemandesPage;
