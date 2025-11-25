import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockApi } from "@/lib/api"; // <-- Corrigé ici

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingMouvement?: any;
}

export default function ModalMouvementStock({ open, onClose, onSaved, editingMouvement }: Props) {
  const [type, setType] = useState(editingMouvement?.type_mouvement || "entree");
  const [quantite, setQuantite] = useState(editingMouvement?.quantite || 0);
  const [articleId, setArticleId] = useState(editingMouvement?.article?.id || "");
  const [magasinSourceId, setMagasinSourceId] = useState(editingMouvement?.magasin_source?.id || "");
  const [magasinDestId, setMagasinDestId] = useState(editingMouvement?.magasin_dest?.id || "");
  const [articles, setArticles] = useState<any[]>([]);
  const [magasins, setMagasins] = useState<any[]>([]);
  const [commentaire, setCommentaire] = useState(editingMouvement?.commentaire || "");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const arts = await stockApi.getArticles();
        const mags = await stockApi.getMagasins();
        setArticles(arts);
        setMagasins(mags);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const payload: any = {
      type_mouvement: type,
      quantite,
      article_id: articleId,
      commentaire,
    };

    if (["entree", "retour"].includes(type)) payload.magasin_dest_id = magasinDestId;
    if (type === "sortie") payload.magasin_source_id = magasinSourceId;
    if (type === "transfert") {
      payload.magasin_source_id = magasinSourceId;
      payload.magasin_dest_id = magasinDestId;
    }

    try {
      if (editingMouvement) {
        await stockApi.updateMouvement(editingMouvement.id, payload);
      } else {
        await stockApi.createMouvement(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du mouvement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingMouvement ? "Modifier" : "Ajouter"} Mouvement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Type de mouvement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entree">Entrée</SelectItem>
              <SelectItem value="sortie">Sortie</SelectItem>
              <SelectItem value="retour">Retour</SelectItem>
              <SelectItem value="transfert">Transfert</SelectItem>
              <SelectItem value="inventaire">Inventaire</SelectItem>
            </SelectContent>
          </Select>

          <Select value={articleId} onValueChange={setArticleId}>
            <SelectTrigger>
              <SelectValue placeholder="Article" />
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
            onChange={(e) => setQuantite(parseInt(e.target.value))}
          />

          {["sortie", "transfert"].includes(type) && (
            <Select value={magasinSourceId} onValueChange={setMagasinSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Magasin Source" />
              </SelectTrigger>
              <SelectContent>
                {magasins.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {["entree", "retour", "transfert"].includes(type) && (
            <Select value={magasinDestId} onValueChange={setMagasinDestId}>
              <SelectTrigger>
                <SelectValue placeholder="Magasin Destination" />
              </SelectTrigger>
              <SelectContent>
                {magasins.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input placeholder="Commentaire" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>{editingMouvement ? "Modifier" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
