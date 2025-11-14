// src/pages/rh/Districts.tsx
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

interface District {
  id?: string;
  name: string;
  code: string;
  region: string;
}

const Districts = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<District | null>(null);
  const [form, setForm] = useState<District>({ name: "", code: "", region: "" });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await rhApi.getDistricts();
      setDistricts(data);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les districts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🔧 Modals
  const openAddModal = () => {
    setEditing(null);
    setForm({ name: "", code: "", region: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (d: District) => {
    setEditing(d);
    setForm(d);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ Enregistrement
  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.region) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    try {
      if (editing?.id) {
        await rhApi.updateDistrict(editing.id, form);
        toast({ title: "Succès", description: "District modifié avec succès" });
      } else {
        await rhApi.createDistrict(form);
        toast({ title: "Succès", description: "District ajouté avec succès" });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  // ❌ Suppression
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteDistrict(selectedIdToDelete);
      toast({ title: "Succès", description: "District supprimé avec succès" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "La suppression a échoué", variant: "destructive" });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // 🧾 Export PDF via createPDFDoc
  const exportPDF = async () => {
    const data = districts.map(d => [d.name, d.code, d.region]);
    const columns = ["Nom", "Code", "Région"];
    await createPDFDoc("Liste des Districts", data, columns, "districts.pdf");
  };

  // 📊 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      districts.map(d => ({ Nom: d.name, Code: d.code, Région: d.region }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Districts");
    XLSX.writeFile(workbook, "districts.xlsx");
  };

  const filteredDistricts = districts.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Districts</h1>
        <Button onClick={openAddModal}>Ajouter un district</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par nom, code ou région..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des districts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">Région</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistricts.length ? filteredDistricts.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-center">{d.name}</TableCell>
                  <TableCell className="text-center">{d.code}</TableCell>
                  <TableCell className="text-center">{d.region}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(d)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(d.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucun district trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier un district" : "Ajouter un district"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label>Région</Label>
              <Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>{editing ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer ce district ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Districts;
