import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TypeConge {
  id?: string;
  nom: string;
  description?: string;
  nombre_jours_max: number;
}

const TypeCongePage = () => {
  const [types, setTypes] = useState<TypeConge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TypeConge | null>(null);
  const [form, setForm] = useState<Partial<TypeConge>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await rhApi.getTypeConges();
      setTypes(data);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur de chargement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ nombre_jours_max: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (type: TypeConge) => {
    setEditing(type);
    setForm(type);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.nombre_jours_max) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editing?.id) {
        await rhApi.updateTypeConge(editing.id, form);
        toast({ title: "Succès", description: "Type de congé mis à jour" });
      } else {
        await rhApi.createTypeConge(form);
        toast({ title: "Succès", description: "Type de congé ajouté" });
      }
      fetchTypes();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.response?.data ? JSON.stringify(err.response.data) : err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Voulez-vous vraiment supprimer ce type de congé ?")) return;
    try {
      await rhApi.deleteTypeConge(id);
      toast({ title: "Supprimé", description: "Type de congé supprimé" });
      fetchTypes();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.response?.data ? JSON.stringify(err.response.data) : err.message,
        variant: "destructive",
      });
    }
  };

  const filtered = types.filter((t) =>
    t.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold">Types de congé</h1>
        <Button onClick={openAddModal}>Ajouter un type</Button>
      </div>

      <Input
        placeholder="Rechercher un type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des types de congé</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Nombre jours max</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? (
                filtered.map((t) => (
                  <TableRow key={t.id || t.nom} className="hover:bg-gray-50">
                    <TableCell>{t.nom}</TableCell>
                    <TableCell>{t.description || "-"}</TableCell>
                    <TableCell>{t.nombre_jours_max}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(t)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    Aucun type trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal ajout / édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le type" : "Ajouter un type"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={form.nom || ""}
                onChange={(e) =>
                  setForm({ ...form, nom: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Input
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Nombre jours max</Label>
              <Input
                type="number"
                min={1}
                value={form.nombre_jours_max || 1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombre_jours_max: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TypeCongePage;
