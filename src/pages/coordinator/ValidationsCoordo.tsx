// src/pages/cordo/DecaissementsEnAttente.tsx
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

export default function DecaissementsCoordonnateur() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getDecaissements();
      setDecaissements((data.results || data).filter(d => d.statut === "en_attente_coordonnateur"));
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les décaissements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecaissements(); }, []);

  const handleDecision = async (decaissementId: string, decision: "approuve" | "rejete") => {
    setSubmitting(prev => ({ ...prev, [decaissementId]: true }));
    try {
      await cordoApi.createValidation({
        demande_decaissement_id: decaissementId,
        coordonnateur_id: user!.id,
        decision,
        commentaire: commentaires[decaissementId] || "",
      });
      toast({ title: "Succès", description: `Décaissement ${decision === "approuve" ? "approuvé" : "rejeté"}` });
      fetchDecaissements();
    } catch (e: any) {
      console.error("Erreur validation:", e);
      toast({ title: "Erreur", description: e?.message || "Échec de la validation", variant: "destructive" });
    } finally {
      setSubmitting(prev => ({ ...prev, [decaissementId]: false }));
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Décaissements à valider</h1>

      <Card>
        <CardHeader><CardTitle>Décaissements soumis</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant total</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decaissements.length ? decaissements.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.reference || d.id}</TableCell>
                  <TableCell>{Number(d.montant_total).toLocaleString()} Ar</TableCell>
                  <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                  <TableCell>
                    <Input
                      placeholder="Commentaire (optionnel)"
                      value={commentaires[d.id] || ""}
                      onChange={(e) => setCommentaires(prev => ({ ...prev, [d.id]: e.target.value }))}
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
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Aucun décaissement en attente
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
