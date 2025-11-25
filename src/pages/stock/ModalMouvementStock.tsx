import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockApi } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingMouvement?: any;
  currentUserId: string;
}

export default function ModalMouvementStock({ open, onClose, onSaved, editingMouvement, currentUserId }: Props) {
  const [type, setType] = useState(editingMouvement?.type_mouvement || "entree");
  const [quantite, setQuantite] = useState(editingMouvement?.quantite || 0);
  const [articleId, setArticleId] = useState(editingMouvement?.article?.id || "");
  const [magasinSourceId, setMagasinSourceId] = useState(editingMouvement?.magasin_source?.id || "");
  const [magasinDestId, setMagasinDestId] = useState(editingMouvement?.magasin_dest?.id || "");
  const [recepteurType, setRecepteurType] = useState(editingMouvement?.recepteur_type || "autre");
  const [articles, setArticles] = useState<{id: string; nom: string}[]>([]);
  const [magasins, setMagasins] = useState<{id: string; nom: string}[]>([]);
  const [commentaire, setCommentaire] = useState(editingMouvement?.commentaire || "");

  // Réinitialiser les magasins quand le type change
  useEffect(() => {
    setMagasinSourceId("");
    setMagasinDestId("");
    if (type !== "sortie") setRecepteurType("autre"); // Receveur visible seulement pour sortie
  }, [type]);

  // Récupérer articles et magasins
  useEffect(() => {
    const fetchData = async () => {
      try {
        const arts = await stockApi.getArticles();
        const mags = await stockApi.getMagasins();
        setArticles(arts);
        setMagasins(mags);
      } catch (err) {
        console.error("Erreur récupération données :", err);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!articleId) return alert("Veuillez sélectionner un article.");
    if (!quantite || quantite <= 0) return alert("Quantité invalide.");

    const payload: any = {
      type_mouvement: type,
      article_id: articleId,
      quantite,
      commentaire,
      created_by: currentUserId,
      statut: editingMouvement?.statut || "valide",
      recepteur_type: recepteurType,
      recepteur_id: null,
    };

    switch(type) {
      case "entree":
      case "retour":
        if (!magasinDestId) return alert("Magasin destination requis.");
        payload.magasin_dest_id = magasinDestId;
        break;

      case "sortie":
        if (!magasinSourceId) return alert("Magasin source requis.");
        payload.magasin_source_id = magasinSourceId;
        payload.recepteur_type = recepteurType;
        // Si recepteur = magasin, utiliser magasinDestId
        if (recepteurType === "magasin") {
          if (!magasinDestId) return alert("Magasin destination requis pour recepteur magasin.");
          payload.recepteur_id = magasinDestId;
        } else {
          payload.recepteur_id = null;
        }
        break;

      case "transfert":
        if (!magasinSourceId || !magasinDestId) return alert("Source et destination requises.");
        payload.magasin_source_id = magasinSourceId;
        payload.magasin_dest_id = magasinDestId;
        payload.recepteur_type = "autre";
        payload.recepteur_id = null;
        break;

      default:
        return alert("Type de mouvement inconnu.");
    }

    try {
      if (editingMouvement) {
        await stockApi.updateMouvement(editingMouvement.id, payload);
      } else {
        await stockApi.createMouvement(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Erreur enregistrement :", err);
      alert("Erreur lors de l'enregistrement du mouvement");
    }
  };

  const isDisabled =
    !articleId ||
    !quantite ||
    ((type === "sortie" || type === "transfert") && !magasinSourceId) ||
    ((type === "entree" || type === "retour" || type === "transfert") && !magasinDestId) ||
    (type === "sortie" && recepteurType === "magasin" && !magasinDestId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingMouvement ? "Modifier" : "Ajouter"} Mouvement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Type de mouvement */}
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type de mouvement" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entree">Entrée</SelectItem>
              <SelectItem value="sortie">Sortie</SelectItem>
              <SelectItem value="retour">Retour</SelectItem>
              <SelectItem value="transfert">Transfert</SelectItem>
            </SelectContent>
          </Select>

          {/* Article */}
          <Select value={articleId} onValueChange={setArticleId}>
            <SelectTrigger><SelectValue placeholder="Article" /></SelectTrigger>
            <SelectContent>
              {articles.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quantité */}
          <Input
            type="number"
            placeholder="Quantité"
            value={quantite}
            onChange={(e) => setQuantite(parseInt(e.target.value))}
          />

          {/* Magasin Source (sortie / transfert) */}
          {["sortie", "transfert"].includes(type) && (
            <div>
              <Select value={magasinSourceId} onValueChange={setMagasinSourceId}>
                <SelectTrigger><SelectValue placeholder="Magasin Source" /></SelectTrigger>
                <SelectContent>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recepteur Type (uniquement pour sortie) */}
          {type === "sortie" && (
            <Select value={recepteurType} onValueChange={setRecepteurType}>
              <SelectTrigger><SelectValue placeholder="Recepteur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="autre">Autre</SelectItem>
                <SelectItem value="magasin">Magasin</SelectItem>
                <SelectItem value="employe">Employé</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Magasin Destination (entree / retour / transfert / sortie vers magasin) */}
          {["entree", "retour", "transfert", "sortie"].includes(type) && (
            <div>
              <Select value={magasinDestId} onValueChange={setMagasinDestId}>
                <SelectTrigger><SelectValue placeholder="Magasin Destination" /></SelectTrigger>
                <SelectContent>
                  {magasins.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Commentaire */}
          <Input
            placeholder="Commentaire"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isDisabled}>
            {editingMouvement ? "Modifier" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
