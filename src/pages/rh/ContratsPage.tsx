// ContratsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { createContratPDF } from "@/lib/pdfContrat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Types
type Employer = {
  id: string;
  nom_employer: string;
  prenom_employer: string;
  email?: string;
};

type TypeContrat = {
  id: string;
  nom_type: string;
  duree_max_jours?: number | null;
};

const NATURE_OPTIONS = ["emploi", "prestation", "mission"];

const natureLabels: Record<string, string> = {
  emploi: "Contrat de travail",
  prestation: "Contrat de prestation",
  mission: "Contrat de mission"
};

type Contrat = {
  id?: string;
  employer: Employer | null;
  employer_nom?: string;
  type_contrat?: TypeContrat | null;
  type_nom?: string;
  nature_contrat: "emploi" | "prestation" | "mission" | string;
  status_contrat: string;
  date_debut_contrat: string;
  date_fin_contrat?: string | null;
  duree_jours?: number | null;
  salaire?: number | string;
  montant_total?: number | string | null;
  description_mission?: string | null;
  contrat_file?: string | null;
};

// Badge couleur par statut
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

      // Normaliser contrats pour employer_nom et type_nom
      const normalized: Contrat[] = (c || []).map((x: any) => ({
        ...x,
        employer_nom: x.employer ? `${x.employer.nom_employer} ${x.employer.prenom_employer}`.trim() : "-",
        type_nom: x.type_contrat?.nom_type || x.type_nom || "-",
        employer: x.employer || null,
        type_contrat: x.type_contrat || null,
      }));

      setContrats(normalized);
      setEmployers(e || []);
      setTypes(Array.isArray(t) ? t : []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return contrats.filter(c => {
      if (filterStatus !== "all" && c.status_contrat !== filterStatus) return false;
      if (filterNature !== "all" && c.nature_contrat !== filterNature) return false;
      if (filterEmployer !== "all" && c.employer?.id !== filterEmployer) return false;
      if (filterType !== "all" && c.type_contrat?.id !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        const combined = `${c.employer_nom ?? ""} ${c.type_nom ?? ""} ${c.nature_contrat} ${c.status_contrat}`.toLowerCase();
        return combined.includes(s);
      }
      return true;
    });
  }, [contrats, filterStatus, filterNature, filterEmployer, filterType, search]);

  // Modal création
  const openCreate = () => {
    setEditing({
      nature_contrat: "emploi",
      status_contrat: "actif",
      date_debut_contrat: new Date().toISOString().slice(0, 10),
      salaire: 0,
      employer: null,
      type_contrat: null
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: Contrat) => {
    setEditing({ ...c });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  // Générer PDF
  const generatePDF = async (contrat: Contrat) => {
    try {
      const pdfData = {
        ...contrat,
        employer: { full_name: contrat.employer_nom },
        nature_label: natureLabels[contrat.nature_contrat] ?? contrat.nature_contrat,
        status_label: contrat.status_contrat
      };
      await createContratPDF(pdfData);
    } catch (err: any) {
      console.error("Erreur génération PDF", err);
    }
  };

  // Sauvegarder contrat
  const saveContrat = async () => {
    if (!editing || !editing.employer || !editing.date_debut_contrat) {
      toast({ title: "Erreur", description: "Employé et date de début obligatoires.", variant: "destructive" });
      return;
    }

    if (editing.date_fin_contrat && new Date(editing.date_fin_contrat) < new Date(editing.date_debut_contrat)) {
      toast({ title: "Erreur", description: "La date de fin est antérieure à la date de début.", variant: "destructive" });
      return;
    }

    // Vérification durée max pour nature autre qu'emploi
    if (editing.nature_contrat !== "emploi" && editing.type_contrat && editing.type_contrat.duree_max_jours) {
      const d2 = new Date(editing.date_fin_contrat || editing.date_debut_contrat);
      const d1 = new Date(editing.date_debut_contrat);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
      if (diff > (editing.type_contrat.duree_max_jours || 0)) {
        toast({
          title: "Durée trop longue",
          description: `La durée (${diff} jours) dépasse la limite (${editing.type_contrat.duree_max_jours} jours).`,
          variant: "destructive"
        });
        return;
      }
    }

    const payload: any = {
      employer_id: editing.employer.id,
      type_contrat_id: editing.type_contrat?.id || null,
      nature_contrat: editing.nature_contrat,
      status_contrat: editing.status_contrat,
      date_debut_contrat: editing.date_debut_contrat,
      date_fin_contrat: editing.date_fin_contrat || null,
      salaire: Number(editing.salaire ?? 0),
      montant_total: editing.montant_total != null ? Number(editing.montant_total) : null,
      description_mission: editing.nature_contrat !== "emploi" ? editing.description_mission || "" : null,
    };

    try {
      if (fileToUpload) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
        fd.append("contrat_file", fileToUpload);

        if (editing.id) await (rhApi as any).updateContratFormData(editing.id, fd);
        else await (rhApi as any).createContratFormData(fd);
      } else {
        if (editing.id) await rhApi.updateContrat(editing.id, payload);
        else await rhApi.createContrat(payload);
      }

      setIsModalOpen(false);
      setEditing(null);
      setFileToUpload(null);
      fetchAll();
      toast({ title: "Succès", description: "Contrat sauvegardé." });
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || "Erreur serveur";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  // Supprimer contrat
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
        <CardHeader>
          <CardTitle>Liste des contrats</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Aucun contrat trouvé.</p>
          ) : (
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
                    <TableCell>{c.employer_nom ?? "-"}</TableCell>
                    <TableCell>{c.type_nom ?? "-"}</TableCell>
                    <TableCell>{natureLabels[c.nature_contrat] ?? "-"}</TableCell>
                    <TableCell><Badge className={STATUS_BADGE(c.status_contrat)}>{c.status_contrat}</Badge></TableCell>
                    <TableCell>{c.date_debut_contrat}</TableCell>
                    <TableCell>{c.date_fin_contrat || "-"}</TableCell>
                    <TableCell>{c.montant_total != null ? new Intl.NumberFormat("fr-FR").format(Number(c.montant_total)) + " Ar" : "-"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" onClick={() => openEdit(c)}>Éditer</Button>
                      <Button size="sm" onClick={() => generatePDF(c)}>PDF</Button>
                      <Button size="sm" variant="destructive" onClick={() => askDelete(c.id)}>Supprimer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL AJOUT / EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent aria-describedby="modal-description" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier un contrat" : "Créer un contrat"}</DialogTitle>
            <DialogDescription id="modal-description">
              Remplissez les informations du contrat pour créer ou modifier.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

            {/* Employé */}
            <div>
              <Label>Employé</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.employer?.id ?? ""}
                onChange={e => {
                  const emp = employers.find(emp => emp.id === e.target.value);
                  setEditing(prev => ({ ...prev, employer: emp || null }));
                }}
              >
                <option value="">-- Sélectionner --</option>
                {employers.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nom_employer} {emp.prenom_employer}</option>
                ))}
              </select>
            </div>

            {/* Type contrat */}
            <div>
              <Label>Type de contrat</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.type_contrat?.id ?? ""}
                onChange={e => {
                  const type = types.find(t => t.id === e.target.value);
                  setEditing(prev => ({ ...prev, type_contrat: type || null }));
                }}
              >
                <option value="">-- Sélectionner --</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom_type}</option>)}
              </select>
            </div>

            {/* Nature */}
            <div>
              <Label>Nature</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.nature_contrat ?? ""}
                onChange={e => setEditing(prev => ({ ...prev, nature_contrat: e.target.value }))}
              >
                {NATURE_OPTIONS.map(n => <option key={n} value={n}>{natureLabels[n]}</option>)}
              </select>
            </div>

            {/* Statut */}
            <div>
              <Label>Status</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.status_contrat ?? ""}
                onChange={e => setEditing(prev => ({ ...prev, status_contrat: e.target.value }))}
              >
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>

            {/* Date début */}
            <div>
              <Label>Date début</Label>
              <Input type="date" value={editing?.date_debut_contrat ?? ""} onChange={e => setEditing(prev => ({ ...prev, date_debut_contrat: e.target.value }))} />
            </div>

            {/* Date fin */}
            <div>
              <Label>Date fin</Label>
              <Input type="date" value={editing?.date_fin_contrat ?? ""} onChange={e => setEditing(prev => ({ ...prev, date_fin_contrat: e.target.value }))} />
            </div>

            {/* Salaire */}
            <div>
              <Label>Salaire / Montant total</Label>
              <Input type="number" value={editing?.salaire ?? ""} onChange={e => setEditing(prev => ({ ...prev, salaire: e.target.value }))} />
            </div>

            {/* Description mission */}
            {editing?.nature_contrat !== "emploi" && (
              <div className="col-span-2">
                <Label>Description mission</Label>
                <Input type="text" value={editing?.description_mission ?? ""} onChange={e => setEditing(prev => ({ ...prev, description_mission: e.target.value }))} />
              </div>
            )}

            {/* Fichier contrat */}
            <div className="col-span-2">
              <Label>Fichier contrat</Label>
              <Input type="file" onChange={e => setFileToUpload(e.target.files?.[0] || null)} />
            </div>

          </div>

          <DialogFooter className="mt-4 space-x-2">
            <Button onClick={saveContrat}>{editing?.id ? "Mettre à jour" : "Créer"}</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL SUPPRESSION */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer suppression</DialogTitle>
            <DialogDescription>Voulez-vous vraiment supprimer ce contrat ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContratsPage;
