import React, { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// --------------------
// Interfaces
// --------------------
interface DemandeAchat {
  id: string;
  numero: string;
  article?: { id: string; nom: string };
  quantite: number;
  montant_estime: number;
  statut: string;
  demandeur_id: string;
  finance_valideur_id?: string;
  justification: string;
  commentaire_finance?: string;
  date_validation_finance?: string;
  statut_reception: string;
  date_reception?: string;
  magasin_reception_id?: string;
  created_at: string;
  updated_at: string;
}

// --------------------
// Composant
// --------------------
export default function PageDemandesAchat() {
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [selectedDemande, setSelectedDemande] = useState<DemandeAchat | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const [articles, setArticles] = useState<{ id: string; nom: string }[]>([]);
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [montant, setMontant] = useState(0);
  const [justification, setJustification] = useState("");

  // -------------------------
  // Charger les demandes et articles
  // -------------------------
  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const res = await stockApi.getDemandesAchat();
      setDemandes(res);
    } catch (error) {
      console.error("Erreur récupération demandes achat :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const arts = await stockApi.getArticles();
      setArticles(arts);
    } catch (error) {
      console.error("Erreur récupération articles :", error);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchArticles();
  }, []);

  // -------------------------
  // Valider ou rejeter
  // -------------------------
  const handleValider = async (demande: DemandeAchat) => {
    try {
      await stockApi.validerDemandeAchat(demande.id);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur validation :", error);
    }
  };

  const handleRejeter = (demande: DemandeAchat) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande) return;

    try {
      await stockApi.rejeterDemandeAchat(selectedDemande.id, commentaire);
      setShowDialog(false);
      setCommentaire("");
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur rejet demande :", error);
    }
  };

  // -------------------------
  // Créer nouvelle demande
  // -------------------------
  const handleCreateDemande = async () => {
    if (!articleId || !quantite || !montant || !justification) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    try {
      await stockApi.createDemandeAchat({
        article: articleId,
        quantite,
        montant_estime: montant,
        justification,
      });

      setArticleId("");
      setQuantite(1);
      setMontant(0);
      setJustification("");
      setShowCreate(false);
      fetchDemandes();
    } catch (error: any) {
      console.error("Erreur création demande :", error);
      alert(`Erreur : ${error.message || error}`);
    }
  };

  // -------------------------
  // Rendu
  // -------------------------
  return (
  <div className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">Demandes d'Achat</h1>
      <Button onClick={() => setShowCreate(true)}>Nouvelle Demande</Button>
    </div>

    {loading ? (
      <p>Chargement...</p>
    ) : (
      <Table>
        {/* ...TableHeader et TableBody inchangés */}
      </Table>
    )}

    {/* Modal pour commentaire rejet */}
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
          <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
          <Button variant="destructive" onClick={submitRejet}>Rejeter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal pour créer nouvelle demande */}
    <Dialog open={showCreate} onOpenChange={setShowCreate}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Demande d'Achat</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={articleId} onValueChange={setArticleId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un article" />
            </SelectTrigger>
            <SelectContent>
              {articles.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Quantité"
            value={quantite}
            onChange={(e) => setQuantite(Number(e.target.value))}
          />

          <Input
            type="number"
            placeholder="Montant estimé"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
          />

          <Input
            placeholder="Justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
          <Button onClick={handleCreateDemande}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
}
