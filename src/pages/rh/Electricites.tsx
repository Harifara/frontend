// src/pages/rh/Electricites.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  nom: string;
}

interface Electricite {
  id?: string;
  numero_compteur: string;
  fournisseur: string;
  location?: Location;
  location_id?: string;
  created_at?: string;
  updated_at?: string;
}

const ElectricitesPage = () => {
  const [electricites, setElectricites] = useState<Electricite[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingElectricite, setEditingElectricite] = useState<Electricite | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Electricite>({
    numero_compteur: "",
    fournisseur: "",
    location_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getElectricites();
      setElectricites(data || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les compteurs.", variant: "destructive" });
      setElectricites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const locs = await rhApi.getLocations();
      setLocations(locs || []);
    } catch (err: any) {
      console.error("Erreur fetching locations:", err);
      setLocations([]);
    }
  };

  const handleOpenModal = (electricite?: Electricite) => {
    if (electricite) {
      setEditingElectricite(electricite);
      setForm({
        ...electricite,
        location_id: electricite.location?.id,
      });
    } else {
      setEditingElectricite(null);
      setForm({ numero_compteur: "", fournisseur: "", location_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingElectricite(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.numero_compteur || !form.fournisseur || !form.location_id) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        numero_compteur: form.numero_compteur,
        fournisseur: form.fournisseur,
        location_id: form.location_id,
      };

      if (editingElectricite) {
        await rhApi.updateElectricite(editingElectricite.id!, payload);
        toast({ title: "Succès", description: "Compteur mis à jour." });
      } else {
        await rhApi.createElectricite(payload);
        toast({ title: "Succès", description: "Compteur créé." });
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'opération.", variant: "destructive" });
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      await rhApi.deleteElectricite(selectedIdToDelete);
      toast({ title: "Succès", description: "Compteur supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredElectricites = electricites.filter(e =>
    e.numero_compteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compteurs Électricité</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Compteur</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par numéro, fournisseur ou location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Compteurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Numéro Compteur</TableHead>
                <TableHead className="text-center">Fournisseur</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredElectricites.length ? filteredElectricites.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-center">{e.numero_compteur}</TableCell>
                  <TableCell className="text-center">{e.fournisseur}</TableCell>
                  <TableCell className="text-center">{e.location?.nom}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(e)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(e.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucun compteur trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Création / Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingElectricite ? "Modifier le Compteur" : "Créer un Compteur"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="numero">Numéro Compteur</Label>
              <Input id="numero" value={form.numero_compteur} onChange={(e) => setForm({ ...form, numero_compteur: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="fournisseur">Fournisseur</Label>
              <Input id="fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                value={form.location_id}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                className="w-full border rounded p-2"
                required
              >
                <option value="">-- Sélectionner une Location --</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.nom}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingElectricite ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce compteur ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ElectricitesPage;
