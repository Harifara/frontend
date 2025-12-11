import React, { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// -------------------------
// Interfaces
// -------------------------
interface Article {
  id: string;
  nom: string;
}

interface DemandeAchat {
  id: string;
  numero: string;
  article?: Article | null;
  quantite: number;
  montant_estime: number;
  statut: string;
  demandeur_id: string;
  finance_valideur_id?: string | null;
  justification: string;
  commentaire_finance?: string;
  date_validation_finance?: string;
  statut_reception: string;
  date_reception?: string;
  magasin_reception_id?: string;
  created_at: string;
  updated_at: string;
}

// -------------------------
// Composant
// -------------------------
export default function PageDemandesAchat() {
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDemande, setSelectedDemande] = useState<DemandeAchat | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [montant, setMontant] = useState(0);
  const [justification, setJustification] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // -------------------------
  // Fetch données
  // -------------------------
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await stockApi.getDemandesAchat();
      console.log("Demandes récupérées :", res);
      setDemandes(res.results || res);
    } catch (err) {
      console.error("Erreur récupération demandes :", err);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const arts = await stockApi.getArticles();
      console.log("Articles récupérés :", arts);
      setArticles(arts || []);
    } catch (err) {
      console.error("Erreur récupération articles :", err);
      setArticles([]);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchArticles();
  }, []);

  // -------------------------
  // Actions
  // -------------------------
  const handleValider = async (demande: DemandeAchat) => {
    try {
      console.log("Validation de la demande :", demande);
      await stockApi.validerDemandeAchat(demande.id);
      fetchDemandes();
    } catch (err) {
      console.error("Erreur validation :", err);
    }
  };

  const handleRejeter = (demande: DemandeAchat) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande || !commentaire) {
      alert("Le commentaire est obligatoire.");
      return;
    }

    try {
      console.log("Rejet de la demande :", selectedDemande.id, "commentaire :", commentaire);
      await stockApi.rejeterDemandeAchat(selectedDemande.id, commentaire);
      setShowDialog(false);
      setCommentaire("");
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      console.error("Erreur rejet :", err);
    }
  };

  // -------------------------
  // Création demande
  // -------------------------
  const resetForm = () => {
    setArticleId("");
    setQuantite(1);
    setMontant(0);
    setJustification("");
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const handleCreateDemande = async () => {
    setErrorMessage("");

    if (!articleId || !quantite || !montant || !justification) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);

    try {
      // --- LOG pour debug ---
      console.log("Création demande d'achat - payload envoyé :", {
        article_id: articleId,
        quantite,
        montant_estime: montant,
        justification,
      });

      const res = await stockApi.createDemandeAchat({
        article_id: articleId,
        quantite,
        montant_estime: montant,
        justification,
      });

      console.log("Réponse création :", res);

      resetForm();
      setShowCreate(false);
      fetchDemandes();

    } catch (err: any) {
      console.error("Erreur création :", err);

      if (err.response?.data) {
        console.log("Réponse du serveur :", err.response.data);
        setErrorMessage(JSON.stringify(err.response.data));
      } else {
        setErrorMessage("Erreur lors de la création.");
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Demandes d'Achat</h1>
        <Button onClick={() => setShowCreate(true)}>Nouvelle Demande</Button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : demandes.length === 0 ? (
        <p>Aucune demande trouvée.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Article</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Montant Estimé</TableCell>
              <TableCell>Statut Finance</TableCell>
              <TableCell>Commentaire Finance</TableCell>
              <TableCell>Statut Réception</TableCell>
              <TableCell>Date Réception</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.article?.nom || "-"}</TableCell>
                <TableCell>{d.quantite}</TableCell>
                <TableCell>{d.montant_estime}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{d.commentaire_finance || "-"}</TableCell>
                <TableCell>{d.statut_reception}</TableCell>
                <TableCell>{d.date_reception || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal Rejet */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Commentaire de rejet"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submitRejet}>
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Création */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Demande d'Achat</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={articleId} onValueChange={setArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un article" />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Quantité"
              value={quantite}
              min={1}
              onChange={(e) => setQuantite(Number(e.target.value))}
            />

            <Input
              type="number"
              placeholder="Montant estimé"
              value={montant}
              min={1}
              onChange={(e) => setMontant(Number(e.target.value))}
            />

            <Input
              placeholder="Justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />

            {errorMessage && (
              <p className="text-red-600 text-sm">{errorMessage}</p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              Annuler
            </Button>

            <Button
              disabled={!articleId || !quantite || !montant || !justification || isSubmitting}
              onClick={handleCreateDemande}
            >
              {isSubmitting ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
