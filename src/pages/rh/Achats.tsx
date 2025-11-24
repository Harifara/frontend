import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface TypeAchat {
  id: string;
  nom: string;
}

interface Achat {
  id?: string;
  article: string;
  code_achat: string;
  nombre: number;
  montant: number;
  type_achat?: {
    id: string;
    nom: string;
  } | null;
  type_achat_id?: string | null;
}

export default function Achats() {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [typeAchats, setTypeAchats] = useState<TypeAchat[]>([]);
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
    type_achat_id: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [achatsRes, typesRes] = await Promise.all([
        rhApi.getAchats(),
        rhApi.getTypeAchats(),
      ]);
      console.log("Types d'achats récupérés:", typesRes);
      setAchats(achatsRes?.data || []);
      setTypeAchats(typesRes?.data || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    }
  };

  const handleOpenModal = (achat?: Achat) => {
    if (achat) {
      setEditingAchat(achat);
      setForm({
        ...achat,
        type_achat_id: achat.type_achat?.id || null,
      });
    } else {
      setEditingAchat(null);
      setForm({ article: "", code_achat: "", nombre: 1, montant: 0, type_achat_id: null });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAchat(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.article || !form.code_achat || !form.type_achat_id) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    const payload = {
      article: form.article,
      code_achat: form.code_achat,
      nombre: Number(form.nombre),
      montant: Number(form.montant),
      type_achat_id: form.type_achat_id,
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
      console.error(err);
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
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
    setSelectedIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const filteredAchats = achats.filter(a =>
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
                <TableHead className="text-center">Type Achat</TableHead>
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
                  <TableCell className="text-center">{a.type_achat?.nom || "-"}</TableCell>
                  <TableCell className="text-center">{a.nombre}</TableCell>
                  <TableCell className="text-center">{Number(a.montant).toLocaleString()} Ar</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(a)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(a.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">Aucun achat trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="achat-form-description">
          <DialogHeader>
            <DialogTitle>{editingAchat ? "Modifier l'Achat" : "Créer un Achat"}</DialogTitle>
          </DialogHeader>
          <p id="achat-form-description" className="sr-only">
            Formulaire pour créer ou modifier un achat.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type d'Achat */}
            <div>
              <Label>Type d'Achat</Label>
              <Select
                value={form.type_achat_id ?? ""}
                onValueChange={(v) => setForm({ ...form, type_achat_id: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {typeAchats.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Article */}
            <div>
              <Label>Article</Label>
              <Input
                value={form.article}
                onChange={(e) => setForm({ ...form, article: e.target.value })}
                required
              />
            </div>

            {/* Code Achat */}
            <div>
              <Label>Code Achat</Label>
              <Input
                value={form.code_achat}
                onChange={(e) => setForm({ ...form, code_achat: e.target.value })}
                required
              />
            </div>

            {/* Quantité */}
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                min={1}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: Number(e.target.value) })}
              />
            </div>

            {/* Montant */}
            <div>
              <Label>Montant</Label>
              <Input
                type="number"
                min={0}
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleCloseModal}>
                Annuler
              </Button>
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
