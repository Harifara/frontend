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
// ⚙️ Interfaces
// --------------------
interface Demande {
  id: string;
  numero: string;
  magasin?: { id: string; nom: string };
  article?: { id: string; nom: string };
  quantite_demandee: number;
  quantite_approuvee?: number;
  statut: string;
  priorite: string;
  motif: string;
  commentaire_validation?: string;
  created_at: string;
  updated_at: string;
}

interface Magasin {
  id: string;
  nom: string;
}

interface Article {
  id: string;
  nom: string;
}

// --------------------
// ⚙️ Composant
// --------------------
export default function DemandesReapproPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [magasinId, setMagasinId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [priorite, setPriorite] = useState("normale");
  const [motif, setMotif] = useState("");

  const priorites = ["faible", "normale", "haute", "urgente"];

  // -------------------------
  // 🔹 Charger les demandes
  // -------------------------
  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const res = await stockApi.getDemandes();
      setDemandes(res);
    } catch (error) {
      console.error("Erreur récupération demandes :", error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 🔹 Charger magasins + articles
  // -------------------------
  const fetchMagasinsArticles = async () => {
    try {
      const mags = await stockApi.getMagasins();
      setMagasins(mags);

      const arts = await stockApi.getArticles();
      setArticles(arts);
    } catch (error) {
      console.error("Erreur récupération magasins/articles :", error);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchMagasinsArticles();
  }, []);

  // -------------------------
  // 🔹 Valider demande
  // -------------------------
  const handleValider = async (demande: Demande) => {
    try {
      await stockApi.validerDemande(demande.id);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur validation demande :", error);
    }
  };

  // -------------------------
  // 🔹 Ouvrir modal rejet
  // -------------------------
  const handleRejeter = (demande: Demande) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande) return;

    try {
      await stockApi.rejeterDemande(selectedDemande.id, {
        commentaire_validation: commentaire,
      });
      setShowDialog(false);
      setCommentaire("");
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur rejet demande :", error);
    }
  };

  // -------------------------
  // 🔹 Créer demande
  // -------------------------
  const handleCreateDemande = async () => {
    if (!magasinId || !articleId || !quantite || !motif) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    try {
      const payload = {
        magasin_id: magasinId,
        article_id: articleId,
        quantite_demandee: quantite,
        priorite,
        motif,
      };

      await stockApi.createDemande(payload);

      setShowModal(false);

      setMagasinId("");
      setArticleId("");
      setQuantite(1);
      setPriorite("normale");
      setMotif("");

      fetchDemandes();
    } catch (error: any) {
      console.error("Erreur création demande :", error);
      alert(`Erreur : ${error.message || error}`);
    }
  };

  // -------------------------
  // 🔹 Rendu UI
  // -------------------------
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Demandes de Réapprovisionnement</h1>
        <Button onClick={() => setShowModal(true)}>Nouvelle Demande</Button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Magasin</TableCell>
              <TableCell>Article</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.magasin?.nom || "-"}</TableCell>
                <TableCell>{d.article?.nom || "-"}</TableCell>
                <TableCell>{d.quantite_demandee}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{d.priorite}</TableCell>
                <TableCell className="space-x-2">
                  {d.statut === "en_attente" && (
                    <>
                      <Button onClick={() => handleValider(d)}>Valider</Button>
                      <Button variant="destructive" onClick={() => handleRejeter(d)}>
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

      {/* Modal création */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Demande</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Select value={magasinId} onValueChange={setMagasinId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un magasin" />
              </SelectTrigger>
              <SelectContent>
                {magasins.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={articleId} onValueChange={setArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un article" />
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
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              placeholder="Quantité demandée"
            />

            <Select value={priorite} onValueChange={setPriorite}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                {priorites.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDemande}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal rejet */}
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
    </div>
  );
}
