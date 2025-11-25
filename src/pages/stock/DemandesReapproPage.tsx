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

  const [me, setMe] = useState<any>(null);

  const priorites = ["faible", "normale", "haute", "urgente"];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const user = await stockApi.me();
      setMe(user);

      const d = await stockApi.getDemandes();
      setDemandes(d);

      const mags = await stockApi.getMagasins();
      setMagasins(mags);

      const arts = await stockApi.getArticles();
      setArticles(arts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (demande: Demande) => {
    await stockApi.validerDemande(demande.id);
    loadInitialData();
  };

  const handleRejeter = (demande: Demande) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande) return;
    await stockApi.rejeterDemande(selectedDemande.id, commentaire);
    setShowDialog(false);
    setCommentaire("");
    loadInitialData();
  };

  const handleCreateDemande = async () => {
    if (!magasinId || !articleId || !motif) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const payload = {
        magasin: magasinId,
        article: articleId,
        quantite_demandee: quantite,
        priorite,
        motif,
        demandeur_id: me?.id,
      };

      await stockApi.createDemande(payload);

      setShowModal(false);
      setMagasinId("");
      setArticleId("");
      setQuantite(1);
      setPriorite("normale");
      setMotif("");

      loadInitialData();
    } catch (error: any) {
      alert("Erreur : " + JSON.stringify(error));
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
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

      {/* MODAL CRÉATION */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Demande</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Select value={magasinId} onValueChange={setMagasinId}>
              <SelectTrigger>
                <SelectValue placeholder="Magasin" />
              </SelectTrigger>
              <SelectContent>
                {magasins.map((m) => (
                  <SelectItem value={m.id} key={m.id}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={articleId} onValueChange={setArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="Article" />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem value={a.id} key={a.id}>
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
              placeholder="Quantité"
            />

            <Select value={priorite} onValueChange={setPriorite}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                {priorites.map((p) => (
                  <SelectItem value={p} key={p}>
                    {p}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDemande}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL REJET */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Commentaire"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />

          <DialogFooter>
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
