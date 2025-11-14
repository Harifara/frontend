import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rhApi } from "@/lib/api";
import { MEDIA_URL } from "@/lib/api";
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

interface Fonction { id: string; nom_fonction: string; }
interface District { id: string; name: string; }
interface Employer {
  id?: string;
  nom_employer: string;
  prenom_employer: string;
  email: string;
  telephone?: string;
  status_employer: "actif" | "inactif" | "conge" | "suspendu";
  diplome?: "bacc" | "bacc+1" | "bacc+2" | "licence" | "master";
  domaine_etude?: string;
  date_naissance?: string;
  date_entree: string;
  adresse?: string;
  fonction?: Fonction | null;
  district?: District | null;
  photo_profil?: string;
  cv?: string;
}



const Employes: React.FC = () => {
  const [employes, setEmployes] = useState<Employer[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employer | null>(null);
  const [form, setForm] = useState<Partial<Employer>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

 



  // Chargement initial
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, fct, dist] = await Promise.all([
        rhApi.getEmployes(),
        rhApi.getFonctions(),
        rhApi.getDistricts(),
      ]);
      setEmployes(data);
      setFonctions(fct);
      setDistricts(dist);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur de chargement.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir modal ajout
  const openAddModal = () => {
    setEditing(null);
    setForm({});
    setPhoto(null);
    setCV(null);
    setIsModalOpen(true);
  };

  // Ouvrir modal édition
  const openEditModal = (emp: Employer) => {
    setEditing(emp);
    setForm(emp);
    setPhoto(null);
    setCV(null);
    setIsModalOpen(true);
  };

  // Soumission formulaire
  const handleSubmit = async () => {
    if (!form.nom_employer || !form.prenom_employer || !form.email || !form.date_entree) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    const payload = new FormData();
    payload.append("nom_employer", form.nom_employer);
    payload.append("prenom_employer", form.prenom_employer);
    payload.append("email", form.email);
    payload.append("date_entree", form.date_entree);
    payload.append("status_employer", form.status_employer || "actif");
    if (form.adresse) payload.append("adresse", form.adresse);
    if (form.diplome) payload.append("diplome", form.diplome);
    if (form.telephone) payload.append("telephone", form.telephone);
    if (form.date_naissance) payload.append("date_naissance", form.date_naissance);
    if (form.domaine_etude) payload.append("domaine_etude", form.domaine_etude);
    if (form.fonction?.id) payload.append("fonction_id", form.fonction.id);
    if (form.district?.id) payload.append("district_id", form.district.id);
    if (photo) payload.append("photo_profil", photo);
    if (cv) payload.append("cv", cv);

    try {
      if (editing?.id) {
        await rhApi.updateEmploye(editing.id, payload);
        setEmployes(prev => prev.map(e => (e.id === editing.id ? { ...e, ...form } : e)));
        toast({ title: "Succès", description: "Employé mis à jour" });
      } else {
        const newEmp = await rhApi.createEmploye(payload);
        setEmployes(prev => [...prev, newEmp]);
        toast({ title: "Succès", description: "Employé ajouté" });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.response?.data ? JSON.stringify(err.response.data) : err.message,
        variant: "destructive",
      });
    } finally {
      setIsModalOpen(false);
    }
  };

  // Modal suppression
  const openDeleteModal = (id: string) => { setSelectedIdToDelete(id); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deleteEmploye(selectedIdToDelete);
      toast({ title: "Succès", description: "Employé supprimé" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.response?.data ? JSON.stringify(err.response.data) : err.message, variant: "destructive" });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  // Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(employes.map(e => ({
      Nom: e.nom_employer,
      Prénom: e.prenom_employer,
      Email: e.email,
      Fonction: e.fonction?.nom_fonction || "",
      District: e.district?.name || "",
      Statut: e.status_employer
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
    XLSX.writeFile(workbook, "employes.xlsx");
  };

  // Export PDF
  const exportPDF = async () => {
    const data = employes.map(e => [
      e.nom_employer, e.prenom_employer, e.email,
      e.fonction?.nom_fonction || "", e.district?.name || "", e.status_employer
    ]);
    const columns = ["Nom", "Prénom", "Email", "Fonction", "District", "Statut"];
    await createPDFDoc("Liste des employés", data, columns, "employes.pdf");
  };

  // Filtrage recherche
  const filtered = employes.filter(e => {
    const term = searchTerm.toLowerCase();
    return `${e.nom_employer} ${e.prenom_employer}`.toLowerCase().includes(term) || e.email.toLowerCase().includes(term);
  });

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold">Employés</h1>
        <div className="flex gap-2">
          <Button onClick={openAddModal}>Ajouter un employé</Button>
          <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
          <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
        </div>
      </div>

      {/* Recherche */}
      <Input placeholder="Rechercher un employé..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Liste des employés</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(e => (
                <TableRow key={e.id} className="hover:bg-gray-50">
                  <TableCell>
                    {e.photo_profil ? (
                      <img
                        src={
                          e.photo_profil?.startsWith("http")
                            ? e.photo_profil
                            : `${MEDIA_URL}${e.photo_profil}`
                        }
                        className="w-10 h-10 rounded-full object-cover"
                      />

                    ) : (
                      <span className="text-gray-400 text-sm">Aucune</span>
                    )}
                  </TableCell>
                  <TableCell>{e.nom_employer} {e.prenom_employer}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>{e.fonction?.nom_fonction || "-"}</TableCell>
                  <TableCell>{e.district?.name || "-"}</TableCell>
                  <TableCell>{e.status_employer}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(e)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(e.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">Aucun employé trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal ajout / édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier un employé" : "Ajouter un employé"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-5">
            {/* Nom / Prénom */}
            <div><Label>Nom</Label><Input value={form.nom_employer || ""} onChange={e => setForm({ ...form, nom_employer: e.target.value })} /></div>
            <div><Label>Prénom</Label><Input value={form.prenom_employer || ""} onChange={e => setForm({ ...form, prenom_employer: e.target.value })} /></div>
            {/* Email / Téléphone */}
            <div><Label>Email</Label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Téléphone</Label><Input value={form.telephone || ""} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            {/* Dates */}
            <div><Label>Date de naissance</Label><Input type="date" value={form.date_naissance || ""} onChange={e => setForm({ ...form, date_naissance: e.target.value })} /></div>
            <div><Label>Date d'entrée</Label><Input type="date" value={form.date_entree || ""} onChange={e => setForm({ ...form, date_entree: e.target.value })} /></div>
            {/* Adresse / Diplôme */}
            <div><Label>Adresse</Label><Input value={form.adresse || ""} onChange={e => setForm({ ...form, adresse: e.target.value })} /></div>
            <div>
              <Label>Diplôme</Label>
              <Select value={form.diplome || ""} onValueChange={val => setForm({ ...form, diplome: val as Employer["diplome"] })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner diplôme" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bacc">BACC</SelectItem>
                  <SelectItem value="bacc+1">BACC+1</SelectItem>
                  <SelectItem value="bacc+2">BACC+2</SelectItem>
                  <SelectItem value="licence">Licence</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Domaine / Fonction */}
            <div><Label>Domaine d'étude</Label><Input value={form.domaine_etude || ""} onChange={e => setForm({ ...form, domaine_etude: e.target.value })} /></div>
            <div>
              <Label>Fonction</Label>
              <Select value={form.fonction?.id || ""} onValueChange={val => setForm({ ...form, fonction: fonctions.find(f => f.id === val) || null })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner fonction" /></SelectTrigger>
                <SelectContent>
                  {fonctions.map(f => <SelectItem key={f.id} value={f.id}>{f.nom_fonction}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* District */}
            <div>
              <Label>District</Label>
              <Select value={form.district?.id || ""} onValueChange={val => setForm({ ...form, district: districts.find(d => d.id === val) || null })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner district" /></SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Photo / CV */}
            {editing?.photo_profil && (
              <div className="col-span-2 flex items-center gap-4">
                <img
                  src={
                    editing.photo_profil?.startsWith("http")
                      ? editing.photo_profil
                      : `${MEDIA_URL}${editing.photo_profil}`
                  }
                  className="w-16 h-16 rounded-full object-cover"
                />

                <span className="text-sm text-gray-500">Photo actuelle</span>
              </div>
            )}
            <div>
              <Label>Photo de profil</Label>
              <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            </div>
            {editing?.cv && (
              <div className="col-span-2 flex items-center gap-2">
                <a
                  href={
                    editing.cv?.startsWith("http")
                      ? editing.cv
                      : `${MEDIA_URL}${editing.cv}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Voir le CV actuel
                </a>

                <span className="text-sm text-gray-500">(PDF)</span>
              </div>
            )}
            <div>
              <Label>CV (PDF)</Label>
              <Input type="file" accept=".pdf" onChange={e => setCV(e.target.files?.[0] || null)} />
            </div>
            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <Select value={form.status_employer || ""} onValueChange={val => setForm({ ...form, status_employer: val as Employer["status_employer"] })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="conge">En congé</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employes;
