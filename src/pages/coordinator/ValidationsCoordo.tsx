import React, { useEffect, useState } from "react";
import { financeApi, cordoApi } from "@/lib/api";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Decaissement {
  id: string;
  reference?: string;
  montant_total: number;
  statut: string;
  date_creation: string;
  date_decaissement?: string;
}

interface Props {
  filtreStatut: string; // ex: "en_attente_coordonnateur"
  titre: string;
}

export default function DecaissementsList({ filtreStatut, titre }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const badge = (status: string) => {
    switch (status) {
      case "brouillon": return "bg-gray-200 text-gray-800";
      case "en_attente_coordonnateur": return "bg-yellow-100 text-yellow-800";
      case "approuve": return "bg-green-100 text-green-800";
      case "rejete": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      const allDec = data.results || data;

      let filtered: Decaissement[] = [];

      if (filtreStatut === "en_attente_coordonnateur") {
        // Inclure les décaissements soumis par finance (brouillon) et en attente coordonnateur
        filtered = allDec.filter(d => 
          d.statut === "en_attente_coordonnateur" || d.statut === "brouillon"
        );
      } else {
        filtered = allDec.filter(d => d.statut === filtreStatut);
      }

      setDecaissements(filtered);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecaissements(); }, []);

  const handleDecision = async (id: string, decision: "approuve" | "rejete") => {
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      await cordoApi.createValidation({
        demande_decaissement_id: id,
        coordonnateur_id: user!.id,
        decision,
        commentaire: commentaires[id] || "",
      });
      toast({ title: "Succès", description: `Décaissement ${decision === "approuve" ? "approuvé" : "rejeté"}` });
      fetchDecaissements();
    } catch {
      toast({ title: "Erreur", description: "Action échouée", variant: "destructive" });
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">{titre}</h1>

      <Card>
        <CardHeader><CardTitle>{titre}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Statut</TableHead>
                {filtreStatut === "en_attente_coordonnateur" && <TableHead>Commentaire</TableHead>}
                {filtreStatut === "en_attente_coordonnateur" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {decaissements.length ? decaissements.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.reference || d.id}</TableCell>
                  <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
                  <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${badge(d.statut)}`}>{d.statut}</span>
                  </TableCell>
                  {filtreStatut === "en_attente_coordonnateur" && (
                    <>
                      <TableCell>
                        <Input
                          placeholder="Commentaire (optionnel)"
                          value={commentaires[d.id] || ""}
                          onChange={e => setCommentaires(prev => ({ ...prev, [d.id]: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleDecision(d.id, "approuve")}
                          disabled={submitting[d.id]}
                        >
                          {submitting[d.id] ? "..." : "Approuver"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDecision(d.id, "rejete")}
                          disabled={submitting[d.id]}
                        >
                          {submitting[d.id] ? "..." : "Rejeter"}
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={filtreStatut === "en_attente_coordonnateur" ? 6 : 4} className="text-center py-6">
                    Aucun décaissement
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
