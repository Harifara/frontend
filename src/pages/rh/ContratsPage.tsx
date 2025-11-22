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

/**
 * Page Contrats complète et corrigée
 *
 * - Types adaptés à ton backend (nom_employer / prenom_employer)
 * - Normalisation employer_nom & type_nom
 * - Selects et filtres affichent correctement le nom complet
 * - Validation côté client des règles essentielles
 * - Envoi des champs employer_id / type_contrat_id (ou employer / type_contrat selon api)
 */

// Types (adapter si besoin)
type Employer = {
  id: string;
  nom_employer: string;
  prenom_employer: string;
  email?: string;
  // autres champs optionnels...
};

type TypeContrat = {
  id: string;
  nom_type: string;
  duree_max_jours?: number | null;
  // autres champs...
};

const natureLabels = {
  emploi: "Contrat de travail",
  prestation: "Contrat de prestation",
  mission: "Contrat de mission"
};


type Contrat = {
  id?: string;
  employer: string | Employer;
  employer_nom?: string;
  type_contrat?: string | TypeContrat | null;
  type_nom?: string | null;
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

// helper badge classes
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

const ContratsPage: React.FC = () => {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [types, setTypes] = useState<TypeContrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // FILTRES
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [filterNature, setFilterNature] = useState<string | "all">("all");
  const [filterEmployer, setFilterEmployer] = useState<string | "all">("all");
  const [filterType, setFilterType] = useState<string | "all">("all");

  // MODAL CREER/EDITER
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contrat> | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // SUPPRESSION
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { toast } = useToast();

  // Chargement initial
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, e, t] = await Promise.all([
        rhApi.getContrats(),      // attendu: liste de contrats
        rhApi.getEmployes(),      // attendu: liste d'employés (nom_employer, prenom_employer)
        rhApi.getTypeContrats()   // attendu: liste de types de contrat (nom_type, duree_max_jours)
      ]);

      // Normalisation : employer_nom et type_nom pour affichage
      const normalized: Contrat[] = (c || []).map((x: any) => ({
        ...x,
        employer_nom:
          typeof x.employer === "string"
            ? x.employer
            : x.employer
            ? `${x.employer.nom_employer || ""} ${x.employer.prenom_employer || ""}`.trim()
            : (x.employer_nom || ""),
        type_nom:
          (x.type_contrat && typeof x.type_contrat === "object" && x.type_contrat.nom_type) ||
          x.type_nom ||
          (typeof x.type_contrat === "string" ? x.type_contrat : undefined),
      }));

      setContrats(normalized);
      setEmployers(e || []);
      setTypes(t || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de charger.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Filtrage memoized
  const filtered = useMemo(() => {
    return contrats.filter(c => {
      if (filterStatus !== "all" && c.status_contrat !== filterStatus) return false;
      if (filterNature !== "all" && c.nature_contrat !== filterNature) return false;
      if (filterEmployer !== "all" && String((c as any).employer?.id || c.employer) !== filterEmployer) return false;
      if (filterType !== "all" && String((c as any).type_contrat?.id || c.type_contrat) !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        const combined = `${c.employer_nom || (c as any).employer?.nom_employer || ""} ${c.type_nom || c.type_contrat || ""} ${c.nature_contrat || ""} ${c.status_contrat || ""}`.toLowerCase();
        return combined.includes(s);
      }
      return true;
    });
  }, [contrats, filterStatus, filterNature, filterEmployer, filterType, search]);

  // OUVRIR MODAL CREATION
  const openCreate = () => {
    setEditing({
      nature_contrat: "emploi",
      status_contrat: "actif",
      date_debut_contrat: new Date().toISOString().slice(0, 10),
      salaire: 0,
      employer: "", // sera employer_id lors de l'envoi
      type_contrat: ""
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: Contrat) => {
    // s'assurer que employer soit l'objet si possible (pour select)
    const empObj = c.employer && typeof c.employer === "object" ? c.employer as Employer : undefined;
    const typeObj = c.type_contrat && typeof c.type_contrat === "object" ? c.type_contrat as TypeContrat : undefined;

    setEditing({
      ...c,
      employer: empObj ? empObj : (c.employer || ""),
      type_contrat: typeObj ? typeObj : (c.type_contrat || ""),
      employer_nom: c.employer_nom || (empObj ? `${empObj.nom_employer} ${empObj.prenom_employer}` : "")
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  // Validation côté client
  const validateBeforeSave = () => {
    if (!editing) return false;
    if (!editing.employer) {
      toast({ title: "Erreur", description: "L'employé est obligatoire.", variant: "destructive" });
      return false;
    }
    if (!editing.date_debut_contrat) {
      toast({ title: "Erreur", description: "La date de début est obligatoire.", variant: "destructive" });
      return false;
    }
    if (editing.date_fin_contrat && (new Date(editing.date_fin_contrat) < new Date(editing.date_debut_contrat))) {
      toast({ title: "Erreur", description: "La date de fin est antérieure à la date de début.", variant: "destructive" });
      return false;
    }

    // Si nature != emploi, vérifier durée max si type_contrat a duree_max_jours
    if (editing.nature_contrat && editing.nature_contrat !== "emploi") {
      const typeId = typeof editing.type_contrat === "object" ? (editing.type_contrat as TypeContrat).id : editing.type_contrat;
      const type = types.find(t => String(t.id) === String(typeId));
      if (type?.duree_max_jours && editing.date_fin_contrat) {
        const d1 = new Date(editing.date_debut_contrat);
        const d2 = new Date(editing.date_fin_contrat);
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
        if (diff > (type.duree_max_jours || 0)) {
          toast({
            title: "Durée trop longue",
            description: `La durée (${diff} jours) dépasse la limite (${type.duree_max_jours} jours) pour le type ${type.nom_type}.`,
            variant: "destructive"
          });
          return false;
        }
      }
    }

    return true;
  };

  const generatePDF = (contrat: Contrat) => {
  const data = {
    titre: "Contrat de travail",
    employe: contrat.employer_nom || "-",
    type: contrat.type_nom || "-",
    nature: contrat.nature_contrat || "-",
    status: contrat.status_contrat || "-",
    dateDebut: contrat.date_debut_contrat || "-",
    dateFin: contrat.date_fin_contrat || "-",
    montant: contrat.montant_total || contrat.salaire || "-",
    description: contrat.description_mission || "-"
  };

  // Envoi (create/update)
  const saveContrat = async () => {
    if (!editing) return;
    if (!validateBeforeSave()) return;

    try {
      // Préparer payload compatible avec ton serializer :
      // Serializer attend employer (read-only) et employer_id (write-only),
      // type_contrat (read-only) et type_contrat_id (write-only).
      const payloadObj: any = {
        status_contrat: editing.status_contrat,
        date_debut_contrat: editing.date_debut_contrat,
        date_fin_contrat: editing.date_fin_contrat || null,
        salaire: editing.salaire,
        // si tu veux envoyer d'autres champs, les ajouter ici :
        nature_contrat: editing.nature_contrat,
        montant_total: editing.montant_total,
        description_mission: editing.description_mission,
      };

      // employer_id
      if (typeof editing.employer === "object") payloadObj["employer_id"] = (editing.employer as Employer).id;
      else payloadObj["employer_id"] = editing.employer;

      // type_contrat_id (si présent)
      if (typeof editing.type_contrat === "object") payloadObj["type_contrat_id"] = (editing.type_contrat as TypeContrat).id;
      else if (editing.type_contrat) payloadObj["type_contrat_id"] = editing.type_contrat;

      if (fileToUpload) {
        // envoyer en multipart si l'API supporte
        const fd = new FormData();
        Object.entries(payloadObj).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("contrat_file", fileToUpload);

        if (editing.id && (rhApi as any).updateContratFormData) {
          await (rhApi as any).updateContratFormData(editing.id, fd);
        } else if (!editing.id && (rhApi as any).createContratFormData) {
          await (rhApi as any).createContratFormData(fd);
        } else {
          // fallback : try json endpoints (may fail if backend doesn't accept file)
          if (editing.id) await rhApi.updateContrat(editing.id, payloadObj);
          else await rhApi.createContrat(payloadObj);
        }
      } else {
        // JSON payload
        if (editing.id) await rhApi.updateContrat(editing.id, payloadObj);
        else await rhApi.createContrat(payloadObj);
      }

      setIsModalOpen(false);
      fetchAll();
      toast({ title: "Succès", description: "Contrat sauvegardé." });
    } catch (err: any) {
      // afficher détail si dispo
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || "Erreur serveur";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  const askDelete = (id?: string) => { setDeleteId(id || null); setIsDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await rhApi.deleteContrat(deleteId); setIsDeleteOpen(false); fetchAll(); toast({ title: "Supprimé" }); } 
    catch (err: any) { toast({ title: "Erreur", description: err?.message || "Impossible de supprimer.", variant: "destructive" }); }
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
          {NATURE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
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
                  <TableCell>
                    {c.employer_nom ||
                      `${(c as any).employer?.nom_employer || ""} ${(c as any).employer?.prenom_employer || ""}`.trim() ||
                      "-"}
                  </TableCell>
                  <TableCell>{c.type_nom || (typeof c.type_contrat === "object" ? (c.type_contrat as TypeContrat).nom_type : c.type_contrat) || "-"}</TableCell>
                  <TableCell>{natureLabels[c.nature_contrat] || "-"}</TableCell>
                  <TableCell><Badge className={STATUS_BADGE(c.status_contrat)}>{c.status_contrat}</Badge></TableCell>
                  <TableCell>{c.date_debut_contrat}</TableCell>
                  <TableCell>{c.date_fin_contrat || "-"}</TableCell>
                  <TableCell>
                    {c.montant_total !== null && c.montant_total !== undefined && c.montant_total !== ""
                      ? new Intl.NumberFormat("fr-FR").format(Number(c.montant_total)) + " Ar"
                      : "-"}
                  </TableCell>


                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => openEdit(c)}>Éditer</Button>
                    <Button size="sm" onClick={() => generatePDF(c)}>
                      PDF
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => askDelete(c.id)}>Supprimer</Button>
                    
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <Label>Employé *</Label>
              <select
                className="border rounded p-2 w-full"
                value={typeof editing?.employer === "object" ? (editing.employer as Employer).id : editing?.employer || ""}
                onChange={e => {
                  const emp = employers.find(emp => emp.id === e.target.value);
                  setEditing(prev => ({ ...prev, employer: emp || e.target.value }));
                }}
              >
                <option value="">-- Choisir --</option>
                {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.nom_employer} {emp.prenom_employer}</option>)}
              </select>
            </div>

            {/* Type */}
            <div>
              <Label>Type</Label>
              <select
                className="border rounded p-2 w-full"
                value={typeof editing?.type_contrat === "object" ? (editing.type_contrat as TypeContrat).id : editing?.type_contrat || ""}
                onChange={e => {
                  const t = types.find(t => t.id === e.target.value);
                  setEditing(prev => ({ ...prev, type_contrat: t || e.target.value }));
                }}
              >
                <option value="">-- Choisir --</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom_type}</option>)}
              </select>
            </div>

            {/* Nature */}
            <div>
              <Label>Nature *</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.nature_contrat || ""}
                onChange={e => setEditing(prev => ({ ...prev, nature_contrat: e.target.value }))}
              >
                {NATURE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label>Status *</Label>
              <select
                className="border rounded p-2 w-full"
                value={editing?.status_contrat || ""}
                onChange={e => setEditing(prev => ({ ...prev, status_contrat: e.target.value }))}
              >
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>

            {/* Dates */}
            <div>
              <Label>Date début *</Label>
              <Input type="date" value={editing?.date_debut_contrat || ""} onChange={e => setEditing(prev => ({ ...prev, date_debut_contrat: e.target.value }))} />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input type="date" value={editing?.date_fin_contrat || ""} onChange={e => setEditing(prev => ({ ...prev, date_fin_contrat: e.target.value }))} />
            </div>

            {/* Salaire et montant total */}
            <div>
              <Label>Salaire</Label>
              <Input type="number" value={editing?.salaire || ""} onChange={e => setEditing(prev => ({ ...prev, salaire: e.target.value }))} />
            </div>
            <div>
              <Label>Montant total</Label>
              <Input type="number" value={editing?.montant_total || ""} onChange={e => setEditing(prev => ({ ...prev, montant_total: e.target.value }))} />
            </div>

            {/* Description mission */}
            <div className="md:col-span-2">
              <Label>Description de la mission / prestation</Label>
              <textarea className="border rounded p-2 w-full" value={editing?.description_mission || ""} onChange={e => setEditing(prev => ({ ...prev, description_mission: e.target.value }))}></textarea>
            </div>

            {/* Fichier */}
            <div className="md:col-span-2">
              <Label>Contrat (PDF)</Label>
              <Input type="file" accept="application/pdf" onChange={e => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
            </div>

          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button onClick={() => { setIsModalOpen(false); setEditing(null); setFileToUpload(null); }}>Annuler</Button>
            <Button onClick={saveContrat}>{editing?.id ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
  <DialogContent className="sm:max-w-sm">
    <DialogHeader>
      <DialogTitle>Confirmer la suppression</DialogTitle>
      <DialogDescription>
        Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex gap-2">
      <Button onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
      <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
};

export default ContratsPage;
