// ContratsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { createContratPDF } from "@/lib/pdfContrat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Types
type Employer = { id: string; nom_employer: string; prenom_employer: string; email?: string };
type TypeContrat = { id: string; nom_type: string; duree_max_jours?: number | null };
const NATURE_OPTIONS = ["emploi", "prestation", "mission"];
const natureLabels: Record<string, string> = {
  emploi: "Contrat de travail",
  prestation: "Contrat de prestation",
  mission: "Contrat de mission"
};
type Contrat = {
  id?: string;
  employer: string | Employer | null;
  employer_nom?: string;
  type_contrat?: string | TypeContrat | null;
  type_nom?: string | null;
  nature_contrat: "emploi" | "prestation" | "mission" | string;
  status_contrat: string;
  date_debut_contrat: string;
  date_fin_contrat?: string | null;
  duree_jours?: number | null;
  salaire?: number | string | null;
  montant_total?: number | string | null;
  description_mission?: string | null;
  contrat_file?: string | null;
};

// Badge couleur
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

const ContratsPage: React.FC = () => {
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
  const { toast } = useToast();

  // Chargement initial
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, e, t] = await Promise.all([rhApi.getContrats(), rhApi.getEmployes(), rhApi.getTypeContrats()]);
      const normalized: Contrat[] = (c || []).map((x: any) => ({
        ...x,
        employer_nom: typeof x.employer === "string" ? x.employer : x.employer ? `${x.employer.nom_employer} ${x.employer.prenom_employer}`.trim() : x.employer_nom || "-",
        type_nom: (x.type_contrat && typeof x.type_contrat === "object" && x.type_contrat.nom_type) || x.type_nom || (typeof x.type_contrat === "string" ? x.type_contrat : "-")
      }));
      setContrats(normalized);
      setEmployers(e || []);
      setTypes(Array.isArray(t) ? t : []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger.", variant: "destructive" });
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return contrats.filter(c => {
      if (filterStatus !== "all" && c.status_contrat !== filterStatus) return false;
      if (filterNature !== "all" && c.nature_contrat !== filterNature) return false;
      if (filterEmployer !== "all" && String((c.employer as Employer)?.id ?? c.employer) !== filterEmployer) return false;
      if (filterType !== "all" && String((c.type_contrat as TypeContrat)?.id ?? c.type_contrat) !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        const combined = `${c.employer_nom ?? (c.employer as Employer)?.nom_employer ?? ""} ${(c.employer as Employer)?.prenom_employer ?? ""} ${c.type_nom ?? (typeof c.type_contrat === "object" ? (c.type_contrat as TypeContrat).nom_type : c.type_contrat ?? "")} ${c.nature_contrat ?? ""} ${c.status_contrat ?? ""}`.toLowerCase();
        return combined.includes(s);
      }
      return true;
    });
  }, [contrats, filterStatus, filterNature, filterEmployer, filterType, search]);

  // Modal création/édition
  const openCreate = () => {
    setEditing({ nature_contrat: "emploi", status_contrat: "actif", date_debut_contrat: new Date().toISOString().slice(0, 10), date_fin_contrat: null, salaire: null, montant_total: null, description_mission: "", employer: null, type_contrat: null });
    setFileToUpload(null);
    setIsModalOpen(true);
  };
  const openEdit = (c: Contrat) => {
    const empObj = c.employer && typeof c.employer === "object" ? c.employer as Employer : null;
    const typeObj = c.type_contrat && typeof c.type_contrat === "object" ? c.type_contrat as TypeContrat : null;
    setEditing({ ...c, employer: empObj ?? c.employer ?? null, type_contrat: typeObj ?? c.type_contrat ?? null, employer_nom: c.employer_nom ?? (empObj ? `${empObj.nom_employer} ${empObj.prenom_employer}` : "-"), salaire: c.salaire ?? null, montant_total: c.montant_total ?? null, description_mission: c.description_mission ?? "" });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  // Validation front
  const validateBeforeSave = (): boolean => {
    if (!editing) return false;
    if (!editing.employer) { toast({ title: "Erreur", description: "L'employé est obligatoire.", variant: "destructive" }); return false; }
    if (!editing.date_debut_contrat) { toast({ title: "Erreur", description: "La date de début est obligatoire.", variant: "destructive" }); return false; }
    if (editing.date_fin_contrat && (new Date(editing.date_fin_contrat) < new Date(editing.date_debut_contrat))) { toast({ title: "Erreur", description: "La date de fin est antérieure à la date de début.", variant: "destructive" }); return false; }

    if (editing.nature_contrat && editing.nature_contrat !== "emploi") {
      const typeId = typeof editing.type_contrat === "object" ? (editing.type_contrat as TypeContrat).id : editing.type_contrat;
      if (!typeId) { toast({ title: "Erreur", description: "Le type de contrat est obligatoire pour cette nature.", variant: "destructive" }); return false; }
      if (!editing.description_mission || String(editing.description_mission).trim() === "") { toast({ title: "Erreur", description: "La description de la mission est obligatoire.", variant: "destructive" }); return false; }
      if (editing.montant_total == null || editing.montant_total === "") { toast({ title: "Erreur", description: "Le montant total est obligatoire pour cette nature.", variant: "destructive" }); return false; }

      const typeObj = types.find(t => String(t.id) === String(typeId));
      if (typeObj?.duree_max_jours && editing.date_fin_contrat) {
        const d1 = new Date(editing.date_debut_contrat);
        const d2 = new Date(editing.date_fin_contrat);
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
        if (diff > (typeObj.duree_max_jours || 0)) {
          toast({ title: "Durée trop longue", description: `La durée (${diff} jours) dépasse la limite (${typeObj.duree_max_jours} jours) pour le type ${typeObj.nom_type}.`, variant: "destructive" });
          return false;
        }
      }
    }
    return true;
  };

  // Générer PDF
  const generatePDF = async (contrat: Contrat) => {
    try {
      const pdfData = { ...contrat, employer: { full_name: contrat.employer_nom ?? `${(contrat.employer as Employer)?.nom_employer ?? ""} ${(contrat.employer as Employer)?.prenom_employer ?? ""}`.trim() }, nature_label: natureLabels[contrat.nature_contrat] ?? contrat.nature_contrat, status_label: contrat.status_contrat };
      await createContratPDF(pdfData);
    } catch (err: any) { toast({ title: "Erreur", description: "Impossible de générer le PDF." , variant: "destructive"}); }
  };

  // Save create/update
  const saveContrat = async () => {
  if (!editing || !validateBeforeSave()) return;

  try {
    // Préparer payload strictement typé
    const payloadObj: any = {
      status_contrat: editing.status_contrat,
      date_debut_contrat: editing.date_debut_contrat,
      date_fin_contrat: editing.date_fin_contrat || null,
      nature_contrat: editing.nature_contrat,
      employer_id: typeof editing.employer === "object" ? (editing.employer as Employer).id : editing.employer,
      type_contrat_id: typeof editing.type_contrat === "object" ? (editing.type_contrat as TypeContrat).id : editing.type_contrat || null,
      salaire: null,
      montant_total: null,
      description_mission: null,
      duree_jours: editing.date_debut_contrat && editing.date_fin_contrat
        ? Math.ceil((new Date(editing.date_fin_contrat).getTime() - new Date(editing.date_debut_contrat).getTime()) / (1000 * 3600 * 24))
        : null,
    };

    // Remplir salaire ou montant selon la nature
    if (editing.nature_contrat === "emploi" && editing.salaire != null && editing.salaire !== "") {
      payloadObj.salaire = Number(editing.salaire);
    } else if (editing.nature_contrat !== "emploi") {
      if (editing.montant_total != null && editing.montant_total !== "") {
        payloadObj.montant_total = Number(editing.montant_total);
      }
      if (editing.description_mission && editing.description_mission.trim() !== "") {
        payloadObj.description_mission = editing.description_mission.trim();
      }
    }

    // Gestion upload fichier
    if (fileToUpload) {
      const fd = new FormData();
      Object.entries(payloadObj).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      fd.append("contrat_file", fileToUpload);
      if (editing.id) {
        await (rhApi as any).updateContratFormData(editing.id, fd);
      } else {
        await (rhApi as any).createContratFormData(fd);
      }
    } else {
      if (editing.id) {
        await rhApi.updateContrat(editing.id, payloadObj);
      } else {
        await rhApi.createContrat(payloadObj);
      }
    }

    setIsModalOpen(false);
    setEditing(null);
    setFileToUpload(null);
    fetchAll();
    toast({ title: "Succès", description: "Contrat sauvegardé." });

  } catch (err: any) {
    toast({ title: "Erreur", description: err?.response?.data?.detail || err?.message || "Erreur serveur", variant: "destructive" });
  }
};


  const askDelete = (id?: string) => { setDeleteId(id || null); setIsDeleteOpen(true); };
  const confirmDelete = async () => { 
    if (!deleteId) return; 
    try { 
      await rhApi.deleteContrat(deleteId); 
      setIsDeleteOpen(false); 
      fetchAll(); 
      toast({ title: "Supprimé" }); 
    } catch (err: any) { 
      toast({ title: "Erreur", description: err?.message || "Impossible de supprimer.", variant: "destructive" }); 
    } 
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Gestion des contrats</h1>
        <Button onClick={openCreate}>Ajouter un contrat</Button>
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <Input placeholder="Recherche libre..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded p-2">
          <option value="all">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="expire">Expiré</option>
          <option value="resilie">Résilié</option>
          <option value="suspendu">Suspendu</option>
          <option value="termine">Terminé</option>
        </select>
        <select value={filterNature} onChange={e => setFilterNature(e.target.value)} className="border rounded p-2">
          <option value="all">Toutes les natures</option>
          {NATURE_OPTIONS.map(n => <option key={n} value={n}>{natureLabels[n]}</option>)}
        </select>
        <select value={filterEmployer} onChange={e => setFilterEmployer(e.target.value)} className="border rounded p-2">
          <option value="all">Tous les employés</option>
          {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.nom_employer} {emp.prenom_employer}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded p-2">
          <option value="all">Tous les types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.nom_type}</option>)}
        </select>
      </div>

      {/* TABLEAU */}
      <Card>
        <CardHeader><CardTitle>Liste des contrats</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? <p className="p-4 text-center text-gray-500">Aucun contrat trouvé.</p> :
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.employer_nom ?? `${(c.employer as Employer)?.nom_employer ?? ""} ${(c.employer as Employer)?.prenom_employer ?? ""}`.trim() ?? "-"}</TableCell>
                    <TableCell>{c.type_nom ?? (typeof c.type_contrat === "object" ? (c.type_contrat as TypeContrat).nom_type : c.type_contrat ?? "-")}</TableCell>
                    <TableCell>{natureLabels[c.nature_contrat] ?? "-"}</TableCell>
                    <TableCell><Badge className={STATUS_BADGE(c.status_contrat)}>{c.status_contrat}</Badge></TableCell>
                    <TableCell>{c.date_debut_contrat}</TableCell>
                    <TableCell>{c.date_fin_contrat || "-"}</TableCell>
                    <TableCell>{c.nature_contrat === "emploi" ? (c.salaire != null && c.salaire !== "" ? new Intl.NumberFormat("fr-FR").format(Number(c.salaire)) + " Ar" : "-") : (c.montant_total != null && c.montant_total !== "" ? new Intl.NumberFormat("fr-FR").format(Number(c.montant_total)) + " Ar" : "-")}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" onClick={() => openEdit(c)}>Éditer</Button>
                      <Button size="sm" onClick={() => generatePDF(c)}>PDF</Button>
                      <Button size="sm" variant="destructive" onClick={() => askDelete(c.id)}>Supprimer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>

      {/* MODAL CREATE/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Éditer le contrat" : "Ajouter un contrat"}</DialogTitle>
            <DialogDescription>Remplissez le formulaire pour enregistrer le contrat.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Employé</Label>
              <select className="border p-2 w-full" value={typeof editing?.employer === "object" ? editing?.employer.id : editing?.employer || ""} onChange={e => {
                const emp = employers.find(emp => emp.id === e.target.value);
                setEditing(editing => editing ? { ...editing, employer: emp || null } : null);
              }}>
                <option value="">-- Choisir un employé --</option>
                {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.nom_employer} {emp.prenom_employer}</option>)}
              </select>
            </div>
            <div>
              <Label>Type de contrat</Label>
              <select className="border p-2 w-full" value={typeof editing?.type_contrat === "object" ? editing?.type_contrat.id : editing?.type_contrat || ""} onChange={e => {
                const t = types.find(t => t.id === e.target.value);
                setEditing(editing => editing ? { ...editing, type_contrat: t || null } : null);
              }}>
                <option value="">-- Choisir un type --</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom_type}</option>)}
              </select>
            </div>
            <div>
              <Label>Nature du contrat</Label>
              <select className="border p-2 w-full" value={editing?.nature_contrat} onChange={e => setEditing(editing => editing ? { ...editing, nature_contrat: e.target.value } : null)}>
                {NATURE_OPTIONS.map(n => <option key={n} value={n}>{natureLabels[n]}</option>)}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="border p-2 w-full" value={editing?.status_contrat} onChange={e => setEditing(editing => editing ? { ...editing, status_contrat: e.target.value } : null)}>
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
            <div>
              <Label>Date début</Label>
              <Input type="date" value={editing?.date_debut_contrat} onChange={e => setEditing(editing => editing ? { ...editing, date_debut_contrat: e.target.value } : null)} />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input type="date" value={editing?.date_fin_contrat || ""} onChange={e => setEditing(editing => editing ? { ...editing, date_fin_contrat: e.target.value || null } : null)} />
            </div>
            {editing?.nature_contrat === "emploi" ? (
              <div>
                <Label>Salaire</Label>
                <Input type="number" value={editing?.salaire || ""} onChange={e => setEditing(editing => editing ? { ...editing, salaire: e.target.value } : null)} />
              </div>
            ) : (
              <>
                <div>
                  <Label>Montant total</Label>
                  <Input type="number" value={editing?.montant_total || ""} onChange={e => setEditing(editing => editing ? { ...editing, montant_total: e.target.value } : null)} />
                </div>
                <div>
                  <Label>Description de la mission</Label>
                  <textarea className="border p-2 w-full" value={editing?.description_mission || ""} onChange={e => setEditing(editing => editing ? { ...editing, description_mission: e.target.value } : null)} />
                </div>
              </>
            )}
            <div>
              <Label>Contrat PDF</Label>
              <Input type="file" accept="application/pdf" onChange={e => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button onClick={saveContrat}>{editing?.id ? "Mettre à jour" : "Créer"}</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contrat ?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="destructive" onClick={confirmDelete}>Oui, supprimer</Button>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContratsPage;
