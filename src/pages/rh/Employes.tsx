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
  diplome?: "bacc" | "bacc+2" | "licence" | "master";
  domaine_etude?: string;
  date_naissance?: string;
  date_entree: string;
  adresse?: string;
  fonction?: Fonction | null;
  district?: District | null;
  photo_profil?: string;
  cv?: string;
}

const DEFAULT_USER_ICON = "/default-user-icon.png";

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

  const getPhotoUrl = (photo?: string) => {
    if (!photo) return DEFAULT_USER_ICON;
    if (photo.startsWith("http")) return photo;
    return `${MEDIA_URL.replace(/\/$/, "")}/${photo.replace(/^\/+/, "")}`;
  };

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

  const openAddModal = () => {
    setEditing(null);
    setForm({});
    setPhoto(null);
    setCV(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employer) => {
    setEditing(emp);
    setForm(emp);
    setPhoto(null);
    setCV(null);
    setIsModalOpen(true);
  };

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
        const updatedEmp = await rhApi.updateEmploye(editing.id, payload);
        setEmployes(prev => prev.map(e => (e.id === editing.id ? updatedEmp : e)));
        toast({ title: "Succès", description: "Employé mis à jour" });
      } else {
        const newEmp = await rhApi.createEmploye(payload);

        // ⚡ Corrige : associer la photo locale immédiatement pour l'affichage dans le tableau
        if (photo) newEmp.photo_profil = URL.createObjectURL(photo);

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

  const exportPDF = async () => {
    const data = employes.map(e => [
      e.nom_employer, e.prenom_employer, e.email,
      e.fonction?.nom_fonction || "", e.district?.name || "", e.status_employer
    ]);
    const columns = ["Nom", "Prénom", "Email", "Fonction", "District", "Statut"];
    await createPDFDoc("Liste des employés", data, columns, "employes.pdf");
  };

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
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/rh/employes/${e.id}`)}
                      title="Voir le profil"
                    >
                      <img
                        src={getPhotoUrl(e.photo_profil)}
                        alt={e.nom_employer}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          const target = event.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = DEFAULT_USER_ICON;
                        }}
                      />
                    </div>
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
            {/* Form fields (nom, prenom, email, téléphone, dates, adresse, diplôme, domaine, fonction, district, photo, cv, statut) */}
            {/* ... identique à ton code actuel ... */}
            {/* ⚡ Photo prévisualisation et CV */}
            <div className="col-span-2 flex items-center gap-4">
              {photo ? (
                <img src={URL.createObjectURL(photo)} className="w-16 h-16 rounded-full object-cover" />
              ) : editing?.photo_profil ? (
                <img src={getPhotoUrl(editing.photo_profil)} className="w-16 h-16 rounded-full object-cover" />
              ) : null}
              <Label>Photo de profil</Label>
              <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              {cv ? (
                <a href={URL.createObjectURL(cv)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Voir le CV</a>
              ) : editing?.cv ? (
                <a href={editing.cv.startsWith("http") ? editing.cv : `${MEDIA_URL}${editing.cv}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Voir le CV actuel</a>
              ) : null}
              <Label>CV (PDF)</Label>
              <Input type="file" accept=".pdf" onChange={e => setCV(e.target.files?.[0] || null)} />
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
