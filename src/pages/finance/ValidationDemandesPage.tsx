import React, { useEffect, useState } from "react";
import { fetchWithLog, getHeaders, API_BASE_URL } from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ValidationDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approuver" | "rejeter" | null>(null);
  const [commentaire, setCommentaire] = useState("");

  // Charger les validations
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kong_token");
      const data = await fetchWithLog(`${API_BASE_URL}/finance/validations-demandes/`, {
        headers: getHeaders(token),
      });
      setDemandes(data);
    } catch (e) {
      console.error("Erreur chargement:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Ouvrir le dialog validation
  const openValidationDialog = (id: string, type: "approuver" | "rejeter") => {
    setSelectedId(id);
    setActionType(type);
    setCommentaire("");
    setOpenDialog(true);
  };

  // Action API
  const handleValidation = async () => {
    if (!selectedId || !actionType) return;

    try {
      const token = localStorage.getItem("kong_token");
      await fetchWithLog(
        `${API_BASE_URL}/finance/validations-demandes/${selectedId}/${actionType}/`,
        {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify({
            responsable_finance_id: localStorage.getItem("user_id"),
            commentaire,
          }),
        }
      );

      setOpenDialog(false);
      fetchDemandes();
    } catch (e) {
      console.error("Erreur validation:", e);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Validation des Demandes</h1>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Service Origine</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {demandes.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.type_demande}</TableCell>
                <TableCell>{d.montant} Ar</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{d.service_origine}</TableCell>
                <TableCell className="space-x-2">
                  {d.statut === "en_attente" && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => openValidationDialog(d.id, "approuver")}
                      >
                        Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openValidationDialog(d.id, "rejeter")}
                      >
                        Rejeter
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* DIALOG VALIDATION */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approuver" ? "Approuver" : "Rejeter"} la demande
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <label className="text-sm">Commentaire (facultatif)</label>
            <Input
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Votre remarque..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleValidation}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
