import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface MouvementStock {
  id: string;
  article: string;
  magasin_source: string | null;
  magasin_dest: string | null;
  quantite: number;
  type_mouvement: string;
  magasinier_id: string;
  recepteur_id: string | null;
  recepteur_type: string;
  transporteur: string | null;
  commentaire: string | null;
  date_mouvement: string;
}

interface Article {
  id: string;
  nom: string;
}

interface Magasin {
  id: string;
  nom: string;
}

const MouvementStockManagement: React.FC = () => {
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<MouvementStock | null>(null);
  const [form, setForm] = useState({
    article: "",
    magasin_source: "",
    magasin_dest: "",
    quantite: 0,
    type_mouvement: "entree",
    commentaire: "",
    recepteur_id: "",
    recepteur_type: "magasin",
  });
  const { toast } = useToast();

  // ⚡ Simule le magasinier connecté (à remplacer par ton auth réel)
  const magasinier_id = "uuid-magasinier-1";

  // -----------------------
  // FETCH DATA
  // -----------------------
  const fetchAllData = async () => {
    try {
      const [mouvementsRes, articlesRes, magasinsRes] = await Promise.all([
        stockApi.getMouvements(),
        stockApi.getArticles(),
        stockApi.getMagasins(),
      ]);
      setMouvements(mouvementsRes);
      setArticles(articlesRes);
      setMagasins(magasinsRes);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de charger les données", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // -----------------------
  // CRUD Actions
  // -----------------------
  const handleSave = async () => {
    if (!form.article || !form.quantite || Number(form.quantite) <= 0) {
      toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires et quantité > 0", variant: "destructive" });
      return;
    }

    const payload = {
      article: form.article,
      magasin_source: form.magasin_source || null,
      magasin_dest: form.magasin_dest || null,
      quantite: Number(form.quantite),
      type_mouvement: form.type_mouvement,
      commentaire: form.commentaire || null,
      magasinier_id: magasinier_id,
      recepteur_id: form.recepteur_id || null,
      recepteur_type: form.recepteur_type,
      transporteur: null,
    };

    try {
      if (editingMouvement?.id) {
        await stockApi.updateMouvement(editingMouvement.id, payload);
        toast({ title: "Succès", description: "Mouvement modifié avec succès" });
      } else {
        await stockApi.createMouvement(payload);
        toast({ title: "Succès", description: "Mouvement ajouté avec succès" });
      }

      setOpenModal(false);
      setEditingMouvement(null);
      setForm({
        article: "",
        magasin_source: "",
        magasin_dest: "",
        quantite: 0,
        type_mouvement: "entree",
        commentaire: "",
        recepteur_id: "",
        recepteur_type: "magasin",
      });
      fetchAllData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.response?.data?.detail || error.message || "Impossible d'enregistrer le mouvement", variant: "destructive" });
    }
  };

  const handleEdit = (mvt: MouvementStock) => {
    setEditingMouvement(mvt);
    setForm({
      article: mvt.article,
      magasin_source: mvt.magasin_source || "",
      magasin_dest: mvt.magasin_dest || "",
      quantite: mvt.quantite,
      type_mouvement: mvt.type_mouvement,
      commentaire: mvt.commentaire || "",
      recepteur_id: mvt.recepteur_id || "",
      recepteur_type: mvt.recepteur_type,
    });
    setOpenModal(true);
  };

  const handleDelete = async (mvt: MouvementStock) => {
    if (!confirm(`Supprimer le mouvement de ${articles.find(a => a.id === mvt.article)?.nom || "cet article"} ?`)) return;
    try {
      await stockApi.deleteMouvement(mvt.id);
      toast({ title: "Succès", description: "Mouvement supprimé avec succès" });
      fetchAllData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de supprimer", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gestion des Mouvements de Stock</h2>
        <Button onClick={() => {
          setEditingMouvement(null);
          setForm({
            article: "",
            magasin_source: "",
            magasin_dest: "",
            quantite: 0,
            type_mouvement: "entree",
            commentaire: "",
            recepteur_id: "",
            recepteur_type: "magasin",
          });
          setOpenModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Magasin Source</TableHead>
              <TableHead>Magasin Destination</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mouvements.length ? (
              mouvements.map((mvt) => (
                <TableRow key={mvt.id}>
                  <TableCell>{articles.find(a => a.id === mvt.article)?.nom || "—"}</TableCell>
                  <TableCell className="capitalize">{mvt.type_mouvement}</TableCell>
                  <TableCell>{mvt.quantite}</TableCell>
                  <TableCell>{magasins.find(m => m.id === mvt.magasin_source)?.nom || "—"}</TableCell>
                  <TableCell>{magasins.find(m => m.id === mvt.magasin_dest)?.nom || "—"}</TableCell>
                  <TableCell>{new Date(mvt.date_mouvement).toLocaleString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(mvt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(mvt)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">Aucun mouvement trouvé.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Ajouter / Modifier */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMouvement ? "Modifier le mouvement" : "Ajouter un mouvement"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Article</Label>
              <Select value={form.article} onValueChange={(val) => setForm({ ...form, article: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un article" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(a => <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de mouvement</Label>
              <Select value={form.type_mouvement} onValueChange={(val) => setForm({ ...form, type_mouvement: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">Entrée</SelectItem>
                  <SelectItem value="sortie">Sortie</SelectItem>
                  <SelectItem value="retour">Retour</SelectItem>
                  <SelectItem value="transfert">Transfert</SelectItem>
                  <SelectItem value="inventaire">Inventaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantité</Label>
              <Input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Magasin Source</Label>
              <Select value={form.magasin_source} onValueChange={(val) => setForm({ ...form, magasin_source: val })}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez un magasin" /></SelectTrigger>
                <SelectContent>
                  {magasins.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Magasin Destination</Label>
              <Select value={form.magasin_dest} onValueChange={(val) => setForm({ ...form, magasin_dest: val })}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez un magasin" /></SelectTrigger>
                <SelectContent>
                  {magasins.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Commentaire</Label>
              <Textarea value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MouvementStockManagement;
