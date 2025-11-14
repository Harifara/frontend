import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Edit, Check, X } from "lucide-react"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TypeConge {
  id: string;
  nom: string;
  nombre_jours_max: number;
}

interface Employer {
  id: string;
  nom_employer: string;
  prenom_employer: string;
}

interface Conge {
  id?: string;
  employer: Employer;
  type_conge: TypeConge | null;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  motif: string;
  status_conge: "en_attente" | "approuve" | "refuse" | "annule";
  justificatif?: File | string | null;
}

const Conges: React.FC = () => {
  const [conges, setConges] = useState<Conge[]>([]);
  const [employes, setEmployes] = useState<Employer[]>([]);
  const [typesConge, setTypesConge] = useState<TypeConge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Conge | null>(null);
  const [form, setForm] = useState<Partial<Conge>>({
    status_conge: "en_attente",
    nombre_jours: 1,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [congeData, types, users] = await Promise.all([
        rhApi.getConges(),
        rhApi.getTypeConges(),
        rhApi.getEmployes(),
      ]);
      setConges(congeData);
      setTypesConge(types);
      setEmployes(users);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur de chargement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ status_conge: "en_attente", nombre_jours: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Conge) => {
    setEditing(c);
    setForm({
      ...c,
      type_conge: typesConge.find((t) => t.id === c.type_conge?.id) || null,
    });
    setIsModalOpen(true);
  };

  const updateDateFin = (dateDebut: string, jours?: number) => {
    if (!dateDebut || !jours || jours <= 0) return "";
    const debut = new Date(dateDebut);
    debut.setDate(debut.getDate() + jours - 1);
    return debut.toISOString().split("T")[0];
  };

  // Remplace juste la partie handleSubmit par ceci :

const handleSubmit = async () => {
  try {
    if (!form.employer?.id || !form.type_conge?.id || !form.date_debut || !form.motif) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const dateDebut = new Date(form.date_debut);
    if (dateDebut < new Date(today.toISOString().split("T")[0])) {
      toast({
        title: "Date invalide",
        description: "La date de début ne peut pas être dans le passé.",
        variant: "destructive",
      });
      return;
    }

    const jours = form.nombre_jours && form.nombre_jours > 0 ? form.nombre_jours : 1;
    if (form.type_conge && jours > form.type_conge.nombre_jours_max) {
      toast({
        title: "Nombre de jours trop élevé",
        description: `Le nombre de jours ne peut pas dépasser ${form.type_conge.nombre_jours_max}.`,
        variant: "destructive",
      });
      return;
    }

    const dateFin = form.date_fin || updateDateFin(form.date_debut, jours);

    const formData = new FormData();
    formData.append("employer_id", form.employer.id);
    formData.append("type_conge_id", form.type_conge.id);
    formData.append("date_debut", form.date_debut);
    formData.append("date_fin", dateFin);
    formData.append("nombre_jours", String(jours));
    formData.append("motif", form.motif);
    formData.append("status_conge", form.status_conge || "en_attente");

    if (form.justificatif instanceof File) {
      formData.append("justificatif", form.justificatif);
    }

    if (editing) {
      await rhApi.updateConge(editing.id!, formData);
      toast({ title: "Congé modifié avec succès", variant: "success" });
    } else {
      await rhApi.createConge(formData);
      toast({ title: "Congé ajouté avec succès", variant: "success" });
    }

    setIsModalOpen(false);
    fetchData();
  } catch (err: any) {
    console.error(err);
    toast({
      title: "Erreur lors de l'opération",
      description: err.message || "Une erreur est survenue.",
      variant: "destructive",
    });
  }
};


  const handleApprove = async (id: string) => {
    await rhApi.approveConge(id);
    fetchData();
  };
  const handleReject = async (id: string) => {
    await rhApi.rejectConge(id);
    fetchData();
  };

  const filtered = conges.filter((c) =>
    `${c.employer.nom_employer} ${c.employer.prenom_employer}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-3xl font-bold">Congés</h1>
        <Button onClick={openAddModal}>Ajouter un congé</Button>
      </div>

      <Input
        placeholder="Rechercher un employé..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des congés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell>
                      {c.employer.nom_employer} {c.employer.prenom_employer}
                    </TableCell>
                    <TableCell>{c.type_conge?.nom}</TableCell>
                    <TableCell>{c.date_debut}</TableCell>
                    <TableCell>{c.date_fin}</TableCell>
                    <TableCell>{c.motif}</TableCell>
                    <TableCell>{c.status_conge}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(c)}
                      >
                        Modifier
                      </Button>
                      {c.status_conge === "en_attente" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(c.id!)}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(c.id!)}
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Aucun congé trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL AJOUT / MODIF */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier un congé" : "Ajouter un congé"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Employé */}
            <div>
              <Label>Employé</Label>
              <Select
                value={form.employer?.id || ""}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    employer: employes.find((e) => e.id === val)!,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner employé" />
                </SelectTrigger>
                <SelectContent>
                  {employes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nom_employer} {e.prenom_employer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de congé */}
            <div>
              <Label>Type de congé</Label>
              <Select
                value={form.type_conge?.id || ""}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    type_conge: typesConge.find((t) => t.id === val) || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner type" />
                </SelectTrigger>
                <SelectContent>
                  {typesConge.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date début */}
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={form.date_debut || ""}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const newFin = updateDateFin(newDate, form.nombre_jours);
                  setForm({ ...form, date_debut: newDate, date_fin: newFin });
                }}
              />
            </div>

            {/* Nombre de jours */}
            <div>
              <Label>Nombre de jours</Label>
              <Input
                type="number"
                value={form.nombre_jours || ""}
                onChange={(e) => {
                  const jours = Number(e.target.value) || 1;
                  const newFin = updateDateFin(form.date_debut!, jours);
                  setForm({ ...form, nombre_jours: jours, date_fin: newFin });
                }}
              />
            </div>

            {/* Date fin calculée */}
            <div>
              <Label>Date fin (calculée)</Label>
              <Input type="date" value={form.date_fin || ""} readOnly />
            </div>

            {/* Motif */}
            <div className="col-span-2">
              <Label>Motif</Label>
              <Input
                value={form.motif || ""}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
              />
            </div>

            {/* Justificatif */}
            <div className="col-span-2">
              <Label>Justificatif (optionnel)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) =>
                  setForm({ ...form, justificatif: e.target.files?.[0] })}
              />
              {form.justificatif &&
                typeof form.justificatif !== "string" && (
                  <p className="text-sm mt-1">{form.justificatif.name}</p>
                )}
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

export default Conges;
