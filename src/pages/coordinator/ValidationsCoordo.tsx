// src/pages/cordo/Validations.tsx
import React, { useEffect, useState } from "react";
import { cordoApi } from "@/lib/api";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Validation {
  id: string;
  demande_decaissement_id: string;
  coordonnateur_id: string;
  decision: "approuve" | "rejete";
  commentaire?: string;
  date_validation: string;
}

export default function ValidationsCoordonnateurPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [demandeId, setDemandeId] = useState("");
  const [decision, setDecision] = useState<"approuve" | "rejete">("approuve");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ================= FETCH ================= */
  const fetchValidations = async () => {
    setLoading(true);
    try {
      const data = await cordoApi.getValidations();
      console.log("✅ Validations raw data:", data);
      setValidations(data.results || data);
    } catch (e) {
      console.error("Erreur fetchValidations:", e);
      toast({ title: "Erreur", description: "Impossible de charger les validations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidations();
  }, []);

  /* ================= ACTIONS ================= */
  const createValidation = async () => {
    if (!demandeId) {
      return toast({ title: "Erreur", description: "ID de demande requis", variant: "destructive" });
    }
    setSubmitting(true);
    try {
      await cordoApi.createValidation({
        demande_decaissement_id: demandeId,
        coordonnateur_id: user?.id!,
        decision,
        commentaire,
      });
      toast({ title: "Succès", description: "Validation créée" });
      setDemandeId("");
      setCommentaire("");
      setDecision("approuve");
      fetchValidations();
    } catch (e: any) {
      console.error("Erreur createValidation:", e);
      toast({ title: "Erreur", description: e?.message || "Création échouée", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteValidation = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette validation ?")) return;
    try {
      await cordoApi.deleteValidation(id);
      toast({ title: "Supprimé", description: "Validation supprimée" });
      fetchValidations();
    } catch (e) {
      console.error("Erreur deleteValidation:", e);
      toast({ title: "Erreur", description: "Suppression échouée", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      {/* FORMULAIRE CREATION */}
      <Card>
        <CardHeader><CardTitle>Créer une validation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="ID de la demande de décaissement"
            value={demandeId}
            onChange={(e) => setDemandeId(e.target.value)}
          />
          <Select value={decision} onValueChange={(val) => setDecision(val as "approuve" | "rejete")}>
            <SelectTrigger>
              <SelectValue placeholder="Décision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approuve">Approuvé</SelectItem>
              <SelectItem value="rejete">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Commentaire (optionnel)"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
          <Button onClick={createValidation} disabled={submitting}>
            {submitting ? "Création..." : "Créer la validation"}
          </Button>
        </CardContent>
      </Card>

      {/* TABLE DES VALIDATIONS */}
      <Card>
        <CardHeader><CardTitle>Validations existantes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Demande Décaissement</TableHead>
                <TableHead>Décision</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.id}</TableCell>
                  <TableCell>{v.demande_decaissement_id}</TableCell>
                  <TableCell>{v.decision}</TableCell>
                  <TableCell>{v.commentaire || "-"}</TableCell>
                  <TableCell>{new Date(v.date_validation).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => deleteValidation(v.id)}>Supprimer</Button>
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
