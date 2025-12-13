import React, { useEffect, useState } from "react";
import { financeApi, cordoApi } from "@/lib/api";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
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
}

export default function DecaissementsRecus() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<Decaissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDecaissements();
      const list = res.results || res;
      setData(list.filter((d: Decaissement) =>
        d.statut === "en_attente_coordonnateur"
      ));
    } catch {
      toast({ title: "Erreur", description: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDecision = async (id: string, decision: "approuve" | "rejete") => {
    setSubmitting(p => ({ ...p, [id]: true }));
    try {
      await cordoApi.createValidation({
        demande_decaissement_id: id,
        coordonnateur_id: user!.id,
        decision,
        commentaire: commentaires[id] || "",
      });
      toast({ title: "Succès", description: `Décaissement ${decision}` });
      fetchData();
    } catch {
      toast({ title: "Erreur", description: "Action échouée", variant: "destructive" });
    } finally {
      setSubmitting(p => ({ ...p, [id]: false }));
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Décaissements reçus</h1>

      <Card>
        <CardHeader>
          <CardTitle>Demandes en attente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? data.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.reference || d.id}</TableCell>
                  <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
                  <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                  <TableCell>
                    <Input
                      placeholder="Commentaire"
                      value={commentaires[d.id] || ""}
                      onChange={e =>
                        setCommentaires(p => ({ ...p, [d.id]: e.target.value }))
                      }
                    />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDecision(d.id, "approuve")}
                      disabled={submitting[d.id]}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDecision(d.id, "rejete")}
                      disabled={submitting[d.id]}
                    >
                      Rejeter
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Aucune demande reçue
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
