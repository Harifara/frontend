// ContratsPage.tsx — VERSION COMPLÈTE, CORRIGÉE ET FONCTIONNELLE

import React, { useEffect, useMemo, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// ----------------- Types -----------------
type Employer = {
  id: string;
  nom_employer: string;
  prenom_employer: string;
};

type TypeContrat = {
  id: string;
  nom_type: string;
  duree_max_jours?: number | null;
};

type Contrat = {
  id?: string;
  employer: string | Employer;
  employer_nom?: string;
  type_contrat?: string | TypeContrat | null;
  type_nom?: string | null;
  nature_contrat: string;
  status_contrat: string;
  date_debut_contrat: string;
  date_fin_contrat?: string | null;
  salaire?: number | string;
  montant_total?: number | string | null;
  description_mission?: string | null;
  contrat_file?: string | null;
};

// ----------------- Badges -----------------
const STATUS_BADGE = (status: string) => {
  switch (status) {
    case "actif": return "bg-green-100 text-green-800";
    case "expire": return "bg-yellow-100 text-yellow-800";
    case "resilie": return "bg-red-100 text-red-800";
    case "suspendu": return "bg-orange-100 text-orange-800";
    case "termine": return "bg-slate-100 text-slate-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const NATURE_OPTIONS = ["emploi", "prestation", "mission"];

// ================= PAGE =================
const ContratsPage: React.FC = () => {
  const { toast } = useToast();

  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [types, setTypes] = useState<TypeContrat[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [filterNature, setFilterNature] = useState<string | "all">("all");
  const [filterEmployer, setFilterEmployer] = useState<string | "all">("all");
  const [filterType, setFilterType] = useState<string | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contrat> | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ------------------ FETCH ------------------
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, e, t] = await Promise.all([
        rhApi.getContrats(),
        rhApi.getEmployes(),
        rhApi.getTypeContrats(),
      ]);

      const normalized: Contrat[] = (c || []).map((x: any) => ({
        ...x,
        employer_nom:
          typeof x.employer === "object"
            ? `${x.employer.nom_employer} ${x.employer.prenom_employer}`
            : x.employer_nom,
        type_nom:
          typeof x.type_contrat === "object"
            ? x.type_contrat.nom_type
            : x.type_nom,
      }));

      setContrats(normalized);
      setEmployers(e || []);
      setTypes(t || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ------------------ FILTER ------------------
  const filtered = useMemo(() => {
    return contrats.filter(c => {
      if (filterStatus !== "all" && c.status_contrat !== filterStatus) return false;
      if (filterNature !== "all" && c.nature_contrat !== filterNature) return false;
      if (filterEmployer !== "all" && String((c as any).employer?.id || c.employer) !== filterEmployer) return false;
      if (filterType !== "all" && String((c as any).type_contrat?.id || c.type_contrat) !== filterType) return false;

      if (search) {
        const s = search.toLowerCase();
        const combined = `${c.employer_nom} ${c.type_nom} ${c.nature_contrat} ${c.status_contrat}`.toLowerCase();
        return combined.includes(s);
      }

      return true;
    });
  }, [contrats, search, filterStatus, filterNature, filterEmployer, filterType]);

  // ------------------ CREATE ------------------
  const openCreate = () => {
    setEditing({
      nature_contrat: "emploi",
      status_contrat: "actif",
      date_debut_contrat: new Date().toISOString().slice(0, 10),
      salaire: 0,
      montant_total: 0,
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  // ------------------ EDIT ------------------
  const openEdit = (c: Contrat) => {
    setEditing(c);
    setIsModalOpen(true);
  };

  // ------------------ VALIDATE ------------------
  const validateBeforeSave = () => {
    if (!editing) return false;
    if (!editing.employer) return toast({ title: "Erreur", description: "L'employé est requis", variant: "destructive" });
    if (!editing.date_debut_contrat) return toast({ title: "Erreur", description: "La date de début est requise", variant: "destructive" });

    if (editing.date_fin_contrat && new Date(editing.date_fin_contrat) < new Date(editing.date_debut_contrat)) {
      return toast({ title: "Erreur", description: "Date fin < début", variant: "destructive" });
    }
    return true;
  };

  // ------------------ SAVE ------------------
  const saveContrat = async () => {
    if (!editing) return;
    if (!validateBeforeSave()) return;

    try {
      const payloadObj: any = {
        status_contrat: editing.status_contrat,
        date_debut_contrat: editing.date_debut_contrat,
        date_fin_contrat: editing.date_fin_contrat || null,
        salaire: Number(editing.salaire) || 0,
        montant_total: Number(editing.montant_total) || 0,
        nature_contrat: editing.nature_contrat,
        description_mission: editing.description_mission,
      };

      payloadObj.employer_id = typeof editing.employer === "object" ? editing.employer.id : editing.employer;
      payloadObj.type_contrat_id = typeof editing.type_contrat === "object" ? editing.type_contrat.id : editing.type_contrat;

      if (fileToUpload) {
        const fd = new FormData();
        Object.entries(payloadObj).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("contrat_file", fileToUpload);

        editing.id
          ? await rhApi.updateContratFormData(editing.id, fd)
          : await rhApi.createContratFormData(fd);
      } else {
        editing.id
          ? await rhApi.updateContrat(editing.id, payloadObj)
          : await rhApi.createContrat(payloadObj);
      }

      setIsModalOpen(false);
      fetchAll();
      toast({ title: "Succès", description: "Contrat enregistré" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible d'enregistrer", variant: "destructive" });
    }
  };

  // ------------------ DELETE ------------------
  const askDelete = (id?: string) => {
    setDeleteId(id || null);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await rhApi.deleteContrat(deleteId);
      setIsDeleteOpen(false);
      fetchAll();
      toast({ title: "Supprimé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: "Erreur suppression", variant: "destructive" });
    }
  };

  // ------------------ RENDER ------------------
  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des contrats</h1>
        <Button onClick={openCreate}>Ajouter un contrat</Button>
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <Input placeholder="Recherche..." value={search} onChange={e => setSearch(e.target.value)} />

        <select className="border rounded p-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="expire">Expiré</option>
          <option value="resilie">Résilié</option>
          <option value="suspendu">Suspendu</option>
          <option value="termine">Terminé</option>
        </select>

        <select className="border rounded p-2" value={filterNature} onChange={e => setFilterNature(e.target.value)}>
          <option value="all">Toutes les natures</option>
          {NATURE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <select className="border rounded p-2" value={filterEmployer} onChange={e => setFilterEmployer(e.target.value)}>
          <option value="all">Tous les employés</option>
          {employers.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.nom_employer} {emp.prenom_employer}
            </option>
          ))}
        </select>

        <select className="border rounded p-2" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Tous les types</option>
          {types.map(t => (
            <option key={t.id} value={t.id}>{t.nom_type}</option>
          ))}
        </select>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <Card>
        <CardHeader><CardTitle>Liste des contrats</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.employer_nom}</TableCell>
                  <TableCell>{c.type_nom}</TableCell>
                  <TableCell>{c.nature_contrat}</TableCell>
                  <TableCell><Badge className={STATUS_BADGE(c.status_contrat)}>{c.status_contrat}</Badge></TableCell>
                  <TableCell>{c.date_debut_contrat}</TableCell>
                  <TableCell>{c.date_fin_contrat || "-"}</TableCell>
                  <TableCell>{c.montant_total ? new Intl.NumberFormat('fr-MG').format(Number(c.montant_total)) + " Ar" : "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" onClick={() => openEdit(c)}>Éditer</Button>
                    <Button size="sm" variant="destructive" onClick={() => askDelete(c.id)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---------------- MODAL CREATE/EDIT ---------------- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier le contrat" : "Nouveau contrat"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Employé</Label>
                <select
                  className="border rounded p-2 w-full"
                  value={typeof editing.employer === "object" ? editing.employer.id : editing.employer || ""}
                  onChange={e => setEditing(prev => ({ ...prev!, employer: e.target.value }))}
                >
                  <option value="">-- Sélectionner --</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom_employer} {emp.prenom_employer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Type de contrat</Label>
                <select
                  className="border rounded p-2 w-full"
                  value={typeof editing.type_contrat === "object" ? editing.type_contrat.id : editing.type_contrat || ""}
                  onChange={e => setEditing(prev => ({ ...prev!, type_contrat: e.target.value }))}
                >
                  <option value="">-- Sélectionner --</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.nom_type}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Nature</Label>
                <select
                  className="border p-2 rounded w-full"
                  value={editing.nature_contrat}
                  onChange={e => setEditing(prev => ({ ...prev!, nature_contrat: e.target.value }))}
                >
                  {NATURE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <Label>Status</Label>
                <select
                  className="border p-2 rounded w-full"
                  value={editing.status_contrat}
                  onChange={e => setEditing(prev => ({ ...prev!, status_contrat: e.target.value }))}
                >
                  <option value="actif">Actif</option>
                  <option value="expire">Expiré</option>
                  <option value="resilie">Résilié</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>

              <div>
                <Label>Date début</Label>
                <Input type="date" value={editing.date_debut_contrat} onChange={e => setEditing(prev => ({ ...prev!, date_debut_contrat: e.target.value }))} />
              </div>

              <div>
                <Label>Date fin</Label>
                <Input type="date" value={editing.date_fin_contrat || ""} onChange={e => setEditing(prev => ({ ...prev!, date_fin_contrat: e.target.value }))} />
              </div>

              <div>
                <Label>Salaire mensuel</Label>
                <Input type="number" value={editing.salaire || 0} onChange={e => setEditing(prev => ({ ...prev!, salaire: Number(e.target.value) }))} />
              </div>

              <div>
                <Label>Montant total</Label>
                <Input type="number" value={editing.montant_total || 0} onChange={e => setEditing(prev => ({ ...prev!, montant_total: Number(e.target.value) }))} />
              </div>

              <div>
                <Label>Fichier contrat</Label>
                <Input type="file" onChange={e => setFileToUpload(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={saveContrat}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- MODAL DELETE ---------------- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContratsPage;