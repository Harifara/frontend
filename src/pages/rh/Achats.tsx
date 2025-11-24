import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Achat {
  id?: string;
  article: string;
  code_achat: string;
  nombre: number;
  montant: number;
  demande: string | null;
  type_achat: string | null;
}

export default function Achats() {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [typesAchat, setTypesAchat] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingAchat, setEditingAchat] = useState<Achat | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const [form, setForm] = useState<Achat>({
    article: "",
    code_achat: "",
    nombre: 1,
    montant: 0,
    demande: null,
    type_achat: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ach, dem, type] = await Promise.all([
        rhApi.getAchats(),
        rhApi.getDemandes(),
        rhApi.getTypesAchat(),
      ]);
      setAchats(ach?.data || []);
      setDemandes(dem?.data || []);
      setTypesAchat(type?.data || []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    }
  };

  const handleOpenModal = (achat?: Achat) => {
    if (achat) {
      setEditingAchat(achat);
      setForm({ ...achat });
    } else {
      setEditingAchat(null);
      setForm({ article: "", code_achat: "", nombre: 1, montant: 0, demande: null, type_achat: null });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAchat(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.article || !form.code_achat || !form.type_achat) {
      toast({ title: "Champs requis", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
      return;
    }

    const payload = {
      article: form.article,
      code_achat: form.code_achat,
      nombre: Number(form.nombre),
      montant: Number(form.montant),
      demande_id: form.demande || null,
      type_achat_id: form.type_achat || null,
    };

    try {
      if (editingAchat) {
        await rhApi.updateAchat(editingAchat.id!, payload);
        toast({ title: "Succès", description: "Achat mis à jour." });
      } else {
        await rhApi.createAchat(payload);
        toast({ title: "Succès", description: "Achat créé." });
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'enregistrer l'achat.", variant: "destructive" });
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteAchat(selectedIdToDelete);
      toast({ title: "Succès", description: "Achat supprimé." });
      fetchData();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
    setSelectedIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const filteredAchats = achats.filter((a) =>
    a.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code_achat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* ENTÊTE */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Achats</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Achat</Button>
      </div>

      {/* RECHERCHE */}
      <Input
        placeholder="Rechercher un article..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/3"
      />

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Achats</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Article</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAchats.length > 0 ? filteredAchats.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-center">{a.article}</TableCell>
                  <TableCell className="text-center">{a.code_achat}</TableCell>
                  <TableCell className="text-center">{a.nombre}</TableCell>
                  <TableCell className="text-center">{Number(a.montant).toLocaleString()} Ar</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(a)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(a.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun achat trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAchat ? "Modifier l'Achat" : "Créer un Achat"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Demande</Label>
              <Select value={form.demande ?? ""} onValueChange={(v) => setForm({ ...form, demande: v || null })}>
                <SelectTrigger><SelectValue placeholder="Choisir une demande" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {demandes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.reference} — {d.demandeur_nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type d'Achat</Label>
              <Select value={form.type_achat ?? ""} onValueChange={(v) => setForm({ ...form, type_achat: v || null })}>
                <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {typesAchat.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Article</Label>
              <Input value={form.article} onChange={(e) => setForm({ ...form, article: e.target.value })} />
            </div>

            <div>
              <Label>Code Achat</Label>
              <Input value={form.code_achat} onChange={(e) => setForm({ ...form, code_achat: e.target.value })} />
            </div>

            <div>
              <Label>Quantité</Label>
              <Input type="number" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Montant</Label>
              <Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingAchat ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DELETE */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
          <p>Voulez-vous vraiment supprimer cet achat ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
