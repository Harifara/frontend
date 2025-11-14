// src/pages/TypeContrat.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TypeContrat {
  id?: string;
  nom_type: string;
  description?: string;
}

const TypeContratsPage = () => {
  const [types, setTypes] = useState<TypeContrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TypeContrat | null>(null);
  const [form, setForm] = useState<Partial<TypeContrat>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await rhApi.getTypeContrats();
      setTypes(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur de chargement.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => { setEditing(null); setForm({}); setIsModalOpen(true); };
  const openEditModal = (tc: TypeContrat) => { setEditing(tc); setForm(tc); setIsModalOpen(true); };

  const handleSubmit = async () => {
  if (!form.nom_type) {
    toast({ title: "Champs manquants", description: "Veuillez remplir le nom.", variant: "destructive" });
    return;
  }

  try {
    if (editing?.id) {
      await rhApi.updateTypeContrat(editing.id, form);
      toast({ title: "Succès", description: "Type de contrat mis à jour." });
    } else {
      await rhApi.createTypeContrat(form); // ✅ correction ici
      toast({ title: "Succès", description: "Type de contrat ajouté." });
    }
    fetchData();
    setIsModalOpen(false);
  } catch (err: any) {
    toast({ title: "Erreur", description: err.message || "Erreur lors de la sauvegarde.", variant: "destructive" });
  }
};


  const openDeleteModal = (id: string) => { setSelectedIdToDelete(id); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteTypeContrat(selectedIdToDelete);
      toast({ title: "Succès", description: "Type de contrat supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  const filtered = types.filter(tc => 
    tc.nom_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold">Types de Contrats</h1>
        <Button onClick={openAddModal}>Ajouter un type</Button>
      </div>

      <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />

      <Card>
        <CardHeader><CardTitle>Liste des types de contrats</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? filtered.map(tc => (
                <TableRow key={tc.id} className="hover:bg-gray-50">
                  <TableCell>{tc.nom_type}</TableCell>
                  <TableCell>{tc.description || "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(tc)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(tc.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={4} className="text-center py-6">Aucun type trouvé.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal ajout / édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Modifier un type" : "Ajouter un type"}</DialogTitle></DialogHeader>

          <div className="grid gap-4">
            <div><Label>Nom</Label><Input value={form.nom_type || ""} onChange={e => setForm({ ...form, nom_type: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>{editing ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer ce type de contrat ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TypeContratsPage;
