// src/pages/rh/Locations.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Location {
  id?: string;
  nom: string;
  type_location: string;
  description?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  montant?: number;
  date_echeance?: string;
}

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Location>({
    nom: "",
    type_location: "",
    description: "",
    adresse: "",
    ville: "",
    code_postal: "",
    montant: 0,
    date_echeance: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const locs = await rhApi.getLocations();
      setLocations(locs || []);
    } catch (err: any) {
      console.error("Erreur fetching locations:", err);
      toast({ title: "Erreur", description: err.message || "Impossible de charger les locations.", variant: "destructive" });
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setForm(location);
    } else {
      setEditingLocation(null);
      setForm({
        nom: "",
        type_location: "",
        description: "",
        adresse: "",
        ville: "",
        code_postal: "",
        montant: 0,
        date_echeance: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  // ⚡ Convertir form JS en FormData pour l'API
  const buildFormData = (data: Location) => {
    const formData = new FormData();
    formData.append("nom", data.nom);
    formData.append("type_location", data.type_location);
    if (data.description) formData.append("description", data.description);
    if (data.adresse) formData.append("adresse", data.adresse);
    if (data.ville) formData.append("ville", data.ville);
    if (data.code_postal) formData.append("code_postal", data.code_postal);
    if (data.montant !== undefined) formData.append("montant", data.montant.toString());
    if (data.date_echeance) formData.append("date_echeance", data.date_echeance);
    return formData;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.nom || !form.type_location) {
      toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
      return;
    }

    try {
      const formData = buildFormData(form);

      if (editingLocation) {
        await rhApi.updateLocation(editingLocation.id!, formData);
        toast({ title: "Succès", description: "Location mise à jour." });
      } else {
        await rhApi.createLocation(formData);
        toast({ title: "Succès", description: "Location créée." });
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
      await rhApi.deleteLocation(selectedIdToDelete);
      toast({ title: "Succès", description: "Location supprimée." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredLocations = locations.filter(l =>
    l.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.type_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const exportPDF = async () => {
    const data = filteredLocations.map(l => [
      l.nom,
      l.type_location,
      l.adresse,
      l.ville,
      l.montant,
      l.date_echeance,
    ]);
    const columns = ["Nom", "Type", "Adresse", "Ville", "Montant", "Date échéance"];
    await createPDFDoc("Liste des Locations", data, columns, "locations.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredLocations.map(l => ({
        Nom: l.nom,
        Type: l.type_location,
        Adresse: l.adresse,
        Ville: l.ville,
        Montant: l.montant,
        Date: l.date_echeance,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");
    XLSX.writeFile(workbook, "locations.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Locations</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter une Location</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par nom, type ou ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Ville</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.length ? filteredLocations.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-center">{l.nom}</TableCell>
                  <TableCell className="text-center">{l.type_location}</TableCell>
                  <TableCell className="text-center">{l.ville}</TableCell>
                  <TableCell className="text-center">{l.montant} Ar</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(l)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(l.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucune location trouvée.</TableCell>
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
            <DialogTitle>{editingLocation ? "Modifier la location" : "Créer une location"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="type">Type de location</Label>
              <Input id="type" value={form.type_location} onChange={(e) => setForm({ ...form, type_location: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="code_postal">Code Postal</Label>
              <Input id="code_postal" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="montant">Montant</Label>
              <Input id="montant" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="date_echeance">Date Échéance</Label>
              <Input id="date_echeance" type="date" value={form.date_echeance} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingLocation ? "Mettre à jour" : "Créer"}</Button>
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
          <p>Êtes-vous sûr de vouloir supprimer cette location ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationsPage;
