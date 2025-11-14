import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Commune {
  id: string;
  name: string;
  district: { id: string; name: string };
}

interface Fokontany {
  id?: string;
  name: string;
  code: string;
  commune: Commune;
}

const Fokontanys = () => {
  const [fokontanys, setFokontanys] = useState<Fokontany[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Fokontany | null>(null);
  const [form, setForm] = useState<Fokontany>({
    name: "",
    code: "",
    commune: { id: "", name: "", district: { id: "", name: "" } },
  });

  const { toast } = useToast();

  // 📦 Chargement des données
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fok, com] = await Promise.all([rhApi.getFokontanys(), rhApi.getCommunes()]);
      setFokontanys(fok);
      setCommunes(com);
    } catch (err: any) {
      toast({
        title: "Erreur de chargement",
        description: err.message || "Impossible de charger les données.",
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
    setForm({ name: "", code: "", commune: { id: "", name: "", district: { id: "", name: "" } } });
    setIsModalOpen(true);
  };

  const openEditModal = (f: Fokontany) => {
    setEditing(f);
    setForm(f);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // ✅ Enregistrement
  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.commune.id) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      commune_id: form.commune.id,
    };

    try {
      if (editing?.id) {
        await rhApi.updateFokontany(editing.id, payload);
        toast({ title: "Succès", description: "Fokontany modifié avec succès" });
      } else {
        await rhApi.createFokontany(payload);
        toast({ title: "Succès", description: "Fokontany ajouté avec succès" });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  // ❌ Suppression
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteFokontany(selectedIdToDelete);
      toast({ title: "Succès", description: "Fokontany supprimé avec succès" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "La suppression a échoué",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // 🧾 Export PDF
  const exportPDF = async () => {
  const data = fokontanys.map(f => [f.name, f.code, f.commune.name, f.commune.district.name]);
  const columns = ["Nom", "Code", "Commune", "District"];
  await createPDFDoc("Liste des Fokontany", data, columns, "fokontanys.pdf");
};



  // 📊 Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      fokontanys.map(f => ({
        Nom: f.name,
        Code: f.code,
        Commune: f.commune.name,
        District: f.commune.district.name,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fokontanys");
    XLSX.writeFile(workbook, "fokontanys.xlsx");
  };

  const filteredFokontanys = fokontanys.filter(
    f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.commune.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.commune.district.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fokontany</h1>
        <Button onClick={openAddModal}>Ajouter un Fokontany</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par nom, code, commune ou district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Fokontany</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead className="text-center">Commune</TableHead>
                <TableHead className="text-center">District</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFokontanys.length ? filteredFokontanys.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="text-center">{f.name}</TableCell>
                  <TableCell className="text-center">{f.code}</TableCell>
                  <TableCell className="text-center">{f.commune.name}</TableCell>
                  <TableCell className="text-center">{f.commune.district.name}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(f)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(f.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun fokontany trouvé.</TableCell>
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
            <DialogTitle>{editing ? "Modifier un Fokontany" : "Ajouter un Fokontany"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Commune</Label>
              <Select value={form.commune.id} onValueChange={(val) => {
                const selected = communes.find(c => c.id === val);
                if (selected) setForm({ ...form, commune: selected });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une commune" />
                </SelectTrigger>
                <SelectContent>
                  {communes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
            Êtes-vous sûr de vouloir supprimer ce fokontany ? Cette action est irréversible.
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

export default Fokontanys;
