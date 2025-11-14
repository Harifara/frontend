// src/pages/rh/Communes.tsx
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
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Commune {
  id?: string;
  name: string;
  code: string;
  district: { id: string; name: string };
}

const Communes = () => {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [districts, setDistricts] = useState<Commune["district"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState<Commune | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Commune>({ name: "", code: "", district: { id: "", name: "" } });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [com, dist] = await Promise.all([rhApi.getCommunes(), rhApi.getDistricts()]);
      setCommunes(com);
      setDistricts(dist);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les communes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (commune?: Commune) => {
    if (commune) {
      setEditingCommune(commune);
      setForm(commune);
    } else {
      setEditingCommune(null);
      setForm({ name: "", code: "", district: { id: "", name: "" } });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCommune(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name || !form.code || !form.district.id) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    try {
      const payload = { name: form.name, code: form.code, district_id: form.district.id };
      if (editingCommune) {
        await rhApi.updateCommune(editingCommune.id!, payload);
        toast({ title: "Succès", description: "Commune mise à jour." });
      } else {
        await rhApi.createCommune(payload);
        toast({ title: "Succès", description: "Commune créée." });
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
      await rhApi.deleteCommune(selectedIdToDelete);
      toast({ title: "Succès", description: "Commune supprimée." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const filteredCommunes = communes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.district.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Export PDF via template
  const exportPDF = async () => {
    const data = filteredCommunes.map(c => [c.name, c.code, c.district.name]);
    const columns = ["Nom", "Code", "District"];
    await createPDFDoc("Liste des Communes", data, columns, "communes.pdf");
  };

  // --- Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCommunes.map(c => ({ Nom: c.name, Code: c.code, District: c.district.name }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Communes");
    XLSX.writeFile(workbook, "communes.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communes</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter une Commune</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par nom, code ou district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Communes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">District</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunes.length ? filteredCommunes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-center">{c.name}</TableCell>
                  <TableCell className="text-center">{c.code}</TableCell>
                  <TableCell className="text-center">{c.district.name}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(c)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(c.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucune commune trouvée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajout/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCommune ? "Modifier la commune" : "Créer une commune"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="district">District</Label>
              <Select value={form.district.id} onValueChange={(val) => {
                const selected = districts.find(d => d.id === val);
                if (selected) setForm({ ...form, district: selected });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingCommune ? "Mettre à jour" : "Créer"}</Button>
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
          <p>Êtes-vous sûr de vouloir supprimer cette commune ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communes;
