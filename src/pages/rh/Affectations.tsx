import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Ajouter useNavigate
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface Employer {
  id: string;
  nom_employer: string;
  prenom_employer: string;
  fonction?: Fonction | null;
  district?: District | null;
}

interface Fonction {
  id: string;
  nom_fonction: string;
}

interface District {
  id: string;
  name: string;
}

interface Affectation {
  id?: string;
  employer?: Employer | null;
  ancien_district?: District | null;
  ancienne_fonction?: Fonction | null;
  nouveau_district?: District | null;
  nouveau_fonction?: Fonction | null;
  type_affectation?: "permanente" | "temporaire" | "mission";
  status_affectation?: "active" | "inactive" | "suspendue" | "terminee";
  date_creation_affectation?: string;
  date_fin?: string;
  remarque?: string;
}

const Affectations = () => {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Affectation | null>(null);
  const [form, setForm] = useState<Partial<Affectation>>({});
  const { toast } = useToast();
  const navigate = useNavigate(); // ✅ Ajouter navigate

  // Charger toutes les données
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [affRes, empRes, fctRes, distRes] = await Promise.all([
        rhApi.getAffectations(),
        rhApi.getEmployes(),
        rhApi.getFonctions(),
        rhApi.getDistricts(),
      ]);
      setAffectations(affRes || []);
      setEmployers(empRes || []);
      setFonctions(fctRes || []);
      setDistricts(distRes || []);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors du chargement des données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({});
    setIsModalOpen(true);
  };

  const openEditModal = (a: Affectation) => {
    setEditing(a);
    setForm(a);
    setIsModalOpen(true);
  };

  // Soumission
  const handleSubmit = async () => {
    if (!form.employer) {
      toast({
        title: "Employé manquant",
        description: "Veuillez sélectionner un employé.",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      employer_id: form.employer.id,
      type_affectation: form.type_affectation || "permanente",
      status_affectation: form.status_affectation || "active",
      remarque: form.remarque || "",
      date_fin: form.date_fin || null,
    };

    if (form.nouveau_district) payload.nouveau_district_id = form.nouveau_district.id;
    if (form.nouveau_fonction) payload.nouveau_fonction_id = form.nouveau_fonction.id;

    if (!payload.nouveau_district_id && !payload.nouveau_fonction_id) {
      toast({
        title: "Affectation invalide",
        description: "Veuillez choisir au moins un district ou une fonction.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editing?.id) {
        await rhApi.updateAffectation(editing.id, payload);
        toast({ title: "Succès", description: "Affectation mise à jour avec succès." });
      } else {
        await rhApi.createAffectation(payload);
        toast({ title: "Succès", description: "Affectation ajoutée avec succès." });
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de l’enregistrement.",
        variant: "destructive",
      });
    }
  };

  // Suppression
  const openDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteAffectation(selectedIdToDelete);
      toast({ title: "Supprimé", description: "Affectation supprimée avec succès." });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Suppression impossible.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      affectations.map(a => ({
        Employé: a.employer ? `${a.employer.nom_employer} ${a.employer.prenom_employer}` : "",
        "Ancien district": a.ancien_district?.name || a.employer?.district?.name || "",
        "Ancienne fonction": a.ancienne_fonction?.nom_fonction || a.employer?.fonction?.nom_fonction || "",
        "Nouveau district": a.nouveau_district?.name || "",
        "Nouvelle fonction": a.nouveau_fonction?.nom_fonction || "",
        Type: a.type_affectation,
        Statut: a.status_affectation,
        "Date création": a.date_creation_affectation,
        "Date fin": a.date_fin || "",
        Remarque: a.remarque,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Affectations");
    XLSX.writeFile(workbook, "affectations.xlsx");
  };

  // Export PDF
  const exportPDF = async () => {
    const columns = [
      "Employé",
      "Ancien district",
      "Ancienne fonction",
      "Nouveau district",
      "Nouvelle fonction",
      "Type",
      "Statut",
      "Date création",
      "Date fin",
      "Remarque",
    ];
    const data = affectations.map(a => [
      a.employer ? `${a.employer.nom_employer} ${a.employer.prenom_employer}` : "",
      a.ancien_district?.name || a.employer?.district?.name || "",
      a.ancienne_fonction?.nom_fonction || a.employer?.fonction?.nom_fonction || "",
      a.nouveau_district?.name || "",
      a.nouveau_fonction?.nom_fonction || "",
      a.type_affectation,
      a.status_affectation,
      a.date_creation_affectation,
      a.date_fin || "",
      a.remarque || "",
    ]);
    await createPDFDoc("Liste des affectations", data, columns, "affectations.pdf");
  };

  const filtered = affectations.filter(a => {
    const term = searchTerm.toLowerCase();
    const empName = a.employer
      ? `${a.employer.nom_employer} ${a.employer.prenom_employer}`.toLowerCase()
      : "";
    return empName.includes(term) || (a.remarque?.toLowerCase().includes(term) ?? false);
  });

  if (loading) return <p className="text-center p-8">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Affectations</h1>
        <div className="flex gap-2">
          <Button onClick={openAddModal}>Nouvelle affectation</Button>
          <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
          <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
        </div>
      </div>

      <Input
        placeholder="Rechercher un employé ou une remarque..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des affectations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Ancienne fonction</TableHead>
                <TableHead>Ancien district</TableHead>
                <TableHead>Nouvelle fonction</TableHead>
                <TableHead>Nouveau district</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Motife</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-auto max-h-[70vh] w-full">
              {filtered.length ? (
                filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.employer ? `${a.employer.nom_employer} ${a.employer.prenom_employer}` : "-"}</TableCell>
                    <TableCell>{a.ancienne_fonction?.nom_fonction || a.employer?.fonction?.nom_fonction || "-"}</TableCell>
                    <TableCell>{a.ancien_district?.name || a.employer?.district?.name || "-"}</TableCell>
                    <TableCell>{a.nouveau_fonction?.nom_fonction || "-"}</TableCell>
                    <TableCell>{a.nouveau_district?.name || "-"}</TableCell>
                    <TableCell>{a.type_affectation}</TableCell>
                    <TableCell>{a.remarque || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/rh/affectations/${a.id}`)} // ✅ Chemin corrigé
                      >
                        Voir
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditModal(a)}>Modifier</Button>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteModal(a.id!)}>Supprimer</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6">
                    Aucune affectation trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal ajout / modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier une affectation" : "Nouvelle affectation"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-5">
            {/* Employé */}
            <div>
              <Label>Employé</Label>
              <Select
                value={form.employer?.id || ""}
                onValueChange={val => {
                  const emp = employers.find(e => e.id === val) || null;
                  setForm({ ...form, employer: emp, ancienne_fonction: emp?.fonction || null, ancien_district: emp?.district || null });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un employé" /></SelectTrigger>
                <SelectContent>
                  {employers.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nom_employer} {e.prenom_employer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ancienne fonction / district */}
            {form.ancienne_fonction && <div><Label>Ancienne fonction</Label><Input disabled value={form.ancienne_fonction.nom_fonction} /></div>}
            {form.ancien_district && <div><Label>Ancien district</Label><Input disabled value={form.ancien_district.name} /></div>}

            {/* Nouveau district */}
            <div>
              <Label>Nouveau district (optionnel)</Label>
              <Select value={form.nouveau_district?.id || ""} onValueChange={val => setForm({ ...form, nouveau_district: districts.find(d => d.id === val) || null })}>
                <SelectTrigger><SelectValue placeholder="Choisir un district" /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Nouvelle fonction */}
            <div>
              <Label>Nouvelle fonction (optionnelle)</Label>
              <Select value={form.nouveau_fonction?.id || ""} onValueChange={val => setForm({ ...form, nouveau_fonction: fonctions.find(f => f.id === val) || null })}>
                <SelectTrigger><SelectValue placeholder="Choisir une fonction" /></SelectTrigger>
                <SelectContent>{fonctions.map(f => <SelectItem key={f.id} value={f.id}>{f.nom_fonction}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Label>Type</Label>
              <Select value={form.type_affectation || ""} onValueChange={val => setForm({ ...form, type_affectation: val as any })}>
                <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanente">Permanente</SelectItem>
                  <SelectItem value="temporaire">Temporaire</SelectItem>
                  <SelectItem value="mission">Mission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <Select value={form.status_affectation || ""} onValueChange={val => setForm({ ...form, status_affectation: val as any })}>
                <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspendue">Suspendue</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de fin */}
            <div>
              <Label>Date de fin</Label>
              <Input type="date" value={form.date_fin || ""} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
            </div>

            {/* Remarque */}
            <div className="col-span-3">
              <Label>Motife</Label>
              <Input value={form.remarque || ""} onChange={e => setForm({ ...form, remarque: e.target.value })} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>{editing ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette affectation ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Affectations;
