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
  montant_total: number | string;
  statut: string;
  date_creation: string;
  date_decaissement?: string;
}

export default function DecaissementsRecus() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // 🔹 Récupération des décaissements depuis l'API
  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      console.log("➡️ REQUEST: financeApi.getDecaissements()");
      const res = await financeApi.getDecaissements();
      const list = res.results || res;
      console.log("⬅️ RESPONSE: Décaissements reçus depuis l'API :", list);

      // Filtrer uniquement ceux en attente du coordonnateur
      setDecaissements(list.filter((d: Decaissement) => d.statut === "en_attente_coordonnateur"));
    } catch (err) {
      console.error("Erreur lors de la récupération des décaissements :", err);
      toast({ title: "Erreur", description: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecaissements();
  }, []);

  // 🔹 Validation ou rejet d'un décaissement
  const handleDecision = async (id: string, decision: "approuve" | "rejete") => {
    setSubmitting(prev => ({ ...prev, [id]: true }));
    console.log(`➡️ REQUEST: cordoApi.createValidation() pour ${id} avec décision ${decision}`);
    try {
      await cordoApi.createValidation({
        demande_decaissement_id: id,
        decision,                    // ✅ Ne pas envoyer coordonnateur_id
        commentaire: commentaires[id] || "",
      });
      console.log(`⬅️ RESPONSE: Décaissement ${decision} effectué pour ${id}`);
      toast({ title: "Succès", description: `Décaissement ${decision === "approuve" ? "approuvé" : "rejeté"}` });
      fetchDecaissements(); // rafraîchit la liste après action
    } catch (err: any) {
      console.error("Erreur lors de la validation :", err);
      toast({ title: "Erreur", description: err?.message || "Action échouée", variant: "destructive" });
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Décaissements reçus</h1>

      <Card>
        <CardHeader>
          <CardTitle>Demandes en attente de validation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant</TableHead>
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
