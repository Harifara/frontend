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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Demande {
  id: string;
  numero: string;
  magasin: { id: string; nom: string };
  article: { id: string; nom: string };
  quantite_demandee: number;
  quantite_approuvee?: number;
  statut: string;
  priorite: string;
  motif: string;
  commentaire_validation?: string;
  created_at: string;
}

interface Magasin {
  id: string;
  nom: string;
}

interface Article {
  id: string;
  nom: string;
}

export default function DemandesReapproPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  // 🔹 Formulaire nouvelle demande
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [magasinId, setMagasinId] = useState<string>("");
  const [articleId, setArticleId] = useState<string>("");
  const [quantite, setQuantite] = useState<number>(1);
  const [priorite, setPriorite] = useState<string>("normale");
  const [motif, setMotif] = useState<string>("");

  const priorites = ["faible", "normale", "haute", "urgente"];

  // 🔹 Charger les données
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await stockApi.getDemandes();
      setDemandes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMagasinsArticles = async () => {
    try {
      const mags = await stockApi.getMagasins();
      setMagasins(mags);
      const arts = await stockApi.getArticles();
      setArticles(arts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchMagasinsArticles();
  }, []);

  // 🔹 Actions
  const handleValider = async (demande: Demande) => {
    try {
      await stockApi.validerDemande(demande.id);
      fetchDemandes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejeter = (demande: Demande) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande) return;
    try {
      await stockApi.rejeterDemande(selectedDemande.id, commentaire);
      setShowDialog(false);
      setCommentaire("");
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateDemande = async () => {
    if (!magasinId || !articleId || !quantite || !motif) {
      alert("Veuillez remplir tous les champs !");
      return;
    }
    try {
      const payload = {
        magasin: magasinId,
        article: articleId,
        quantite_demandee: quantite,
        priorite,
        motif,
        demandeur_id: "UUID_DU_MAGASINIER", // remplace par l'utilisateur connecté
      };
      await stockApi.createDemande(payload);
      alert("Demande créée avec succès !");
      setMagasinId("");
      setArticleId("");
      setQuantite(1);
      setPriorite("normale");
      setMotif("");
      fetchDemandes();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de la demande");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Demandes de Réapprovisionnement</h1>

      {/* 🔹 Formulaire création */}
      <div className="p-4 mb-6 border rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Nouvelle Demande</h2>
        <Select value={magasinId} onValueChange={setMagasinId} className="mb-2 w-full">
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un magasin" />
          </SelectTrigger>
          <SelectContent>
            {magasins.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={articleId} onValueChange={setArticleId} className="mb-2 w-full">
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un article" />
          </SelectTrigger>
          <SelectContent>
            {articles.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} placeholder="Quantité" className="mb-2 w-full" />

        <Select value={priorite} onValueChange={setPriorite} className="mb-2 w-full">
          <SelectTrigger>
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            {priorites.map((p) => (
              <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif" className="mb-2 w-full" />

        <Button onClick={handleCreateDemande}>Créer la demande</Button>
      </div>

      {/* 🔹 Table des demandes */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Magasin</TableCell>
              <TableCell>Article</TableCell>
              <TableCell>Qté</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.magasin.nom}</TableCell>
                <TableCell>{d.article.nom}</TableCell>
                <TableCell>{d.quantite_demandee}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{d.priorite}</TableCell>
                <TableCell className="space-x-2">
                  {d.statut === "en_attente" && (
                    <>
                      <Button onClick={() => handleValider(d)}>Valider</Button>
                      <Button variant="destructive" onClick={() => handleRejeter(d)}>Rejeter</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 🔹 Dialog pour le rejet */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Commentaire (optionnel)"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={submitRejet}>Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
