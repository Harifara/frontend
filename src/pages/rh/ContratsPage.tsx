import React, { useEffect, useMemo, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// --------------------------------------------------
// Page complète : Contrats + Détail + Upload PDF
// --------------------------------------------------

/**
 * IMPORTANT : pour l'upload de fichiers PDF depuis le front-end, deux endpoints sont nécessaires côté API :
 * - POST /rh/contrats/ (multipart/form-data) pour créer un contrat avec fichier
 * - PATCH /rh/contrats/:id/ (multipart/form-data) pour mettre à jour un contrat avec un fichier
 *
 * Si ton `rhApi` actuel n'expose pas ces fonctions, ajoute :
 * - createContratFormData(formData: FormData)
 * - updateContratFormData(id: string, formData: FormData)
 * - getContrat(id: string)
 *
 * Le code ci-dessous tentera d'utiliser `rhApi.createContratFormData` / `rhApi.updateContratFormData` s'ils existent;
 * sinon il tombera sur `rhApi.createContrat` / `rhApi.updateContrat` (JSON).
 */

type Employer = { id: string; nom: string };
type TypeContrat = { id: string; nom_type: string };

type Contrat = {
  id?: string;
  employer: string | Employer;
  employer_nom?: string; // utile pour l'affichage
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
  contrat_file?: string | null; // url
};

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

  // FILTRES
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterNature, setFilterNature] = useState<string | null>(null);
  const [filterEmployer, setFilterEmployer] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // MODAL CREER/EDITER
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contrat> | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // DETAIL
  const [detailContrat, setDetailContrat] = useState<Contrat | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // SUPPRESSION
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { toast } = useToast();

  // Chargement initial
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, e, t] = await Promise.all([
        rhApi.getContrats(),
        rhApi.getEmployes(),
        rhApi.getTypeContrats(),
      ]);
      // --- Normalisation minimale pour l'affichage ---
      const normalized: Contrat[] = (c || []).map((x: any) => ({
        ...x,
        employer_nom: typeof x.employer === "string" ? x.employer : x.employer?.nom || x.employer,
        type_nom: x.type_contrat?.nom_type || x.type_nom || (typeof x.type_contrat === "string" ? x.type_contrat : undefined),
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

  // Filtrage (memoisé)
  const filtered = useMemo(() => {
    return contrats.filter(c => {
      if (filterStatus && c.status_contrat !== filterStatus) return false;
      if (filterNature && c.nature_contrat !== filterNature) return false;
      if (filterEmployer && String(c.employer) !== filterEmployer && String((c as any).employer.id) !== filterEmployer) return false;
      if (filterType && String(c.type_contrat) !== filterType && String((c as any).type_contrat?.id) !== filterType) return false;
      if (search) {
        const s = search.toLowerCase();
        const combined = `${c.employer_nom || c.employer} ${c.type_nom || c.type_contrat} ${c.nature_contrat} ${c.status_contrat}`.toLowerCase();
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
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: Contrat) => {
    setEditing({ ...c });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  // DÉTAIL
  const openDetail = async (c: Contrat) => {
    // Essaie d'utiliser rhApi.getContrat si disponible pour récupérer plus d'infos
    try {
      if ((rhApi as any).getContrat && c.id) {
        const full = await (rhApi as any).getContrat(c.id);
        setDetailContrat(full);
      } else {
        setDetailContrat(c);
      }
      setIsDetailOpen(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger le contrat.", variant: "destructive" });
    }
  };

  // SAVE (create/update) avec gestion fichier
  const saveContrat = async () => {
    if (!editing) return;
    if (!editing.employer || !editing.date_debut_contrat) {
      toast({ title: "Champs manquants", description: "Employé et date de début sont requis.", variant: "destructive" });
      return;
    }

    try {
      // Si on a un fichier, utiliser FormData + endpoint file si disponible
      if (fileToUpload) {
        const fd = new FormData();
        // append tous les champs simples
        Object.entries(editing).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("contrat_file", fileToUpload);

        if (editing.id && (rhApi as any).updateContratFormData) {
          await (rhApi as any).updateContratFormData(editing.id, fd);
          toast({ title: "Contrat mis à jour (avec fichier)" });
        } else if (!editing.id && (rhApi as any).createContratFormData) {
          await (rhApi as any).createContratFormData(fd);
          toast({ title: "Contrat créé (avec fichier)" });
        } else {
          // si l'API côté client n'expose pas FormData helpers, on essaie de tomber sur rhApi.createContrat / updateContrat
          // qui risquent d'attendre du JSON : dans ce cas on ne peut pas envoyer le fichier proprement.
          toast({ title: "Attention", description: "L'API ne supporte pas l'upload multipart depuis rhApi. Ajoute createContratFormData / updateContratFormData côté rhApi.", variant: "destructive" });
          return;
        }
      } else {
        // pas de fichier : utiliser JSON
        const payload = { ...editing };
        if (editing.id) {
          await rhApi.updateContrat(editing.id, payload);
          toast({ title: "Contrat mis à jour" });
        } else {
          await rhApi.createContrat(payload);
          toast({ title: "Contrat créé" });
        }
      }

      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" });
    }
  };

  // SUPPRESSION
  const askDelete = (id?: string) => { setDeleteId(id || null); setIsDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await rhApi.deleteContrat(deleteId);
      toast({ title: "Contrat supprimé" });
      setIsDeleteOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de supprimer.", variant: "destructive" });
    }
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Gestion des contrats</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}>Ajouter un contrat</Button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <Input placeholder="Recherche libre..." value={search} onChange={e => setSearch(e.target.value)} />

        <Select value={filterStatus || ""} onValueChange={(v) => setFilterStatus(v || null)}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Tous --</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="expire">Expiré</SelectItem>
            <SelectItem value="resilie">Résilié</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterNature || ""} onValueChange={(v) => setFilterNature(v || null)}>
          <SelectTrigger><SelectValue placeholder="Nature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Tous --</SelectItem>
            <SelectItem value="emploi">Contrat de travail</SelectItem>
            <SelectItem value="mission">Mission</SelectItem>
            <SelectItem value="prestation">Prestation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEmployer || ""} onValueChange={(v) => setFilterEmployer(v || null)}>
          <SelectTrigger><SelectValue placeholder="Employé" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Tous --</SelectItem>
            {employers.map(e => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterType || ""} onValueChange={(v) => setFilterType(v || null)}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Tous --</SelectItem>
            {types.map(t => <SelectItem key={t.id} value={t.id}>{t.nom_type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader><CardTitle>Liste des contrats ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell>{c.employer_nom || (typeof c.employer === "string" ? c.employer : (c as any).employer?.nom)}</TableCell>
                  <TableCell>{c.nature_contrat}</TableCell>
                  <TableCell>{c.type_nom || (c as any).type_contrat?.nom_type || "-"}</TableCell>
                  <TableCell>{c.date_debut_contrat}</TableCell>
                  <TableCell>{c.date_fin_contrat || "-"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE(c.status_contrat)}>{c.status_contrat}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDetail(c)}>Détail</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => askDelete(c.id)} >Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-6">Aucun contrat trouvé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL AJOUT / EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier un contrat" : "Créer un contrat"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Employé *</Label>
              <select className="border rounded p-2 w-full" value={(editing?.employer as any)?.id || (editing?.employer as string) || ""} onChange={e => setEditing({ ...editing, employer: e.target.value })}>
                <option value="">-- Choisir --</option>
                {employers.map(emp => <option key={emp.id} value={emp.id}>{emp.nom}</option>)}
              </select>
            </div>

            <div>
              <Label>Type</Label>
              <select className="border rounded p-2 w-full" value={(editing?.type_contrat as any)?.id || (editing?.type_contrat as string) || ""} onChange={e => setEditing({ ...editing, type_contrat: e.target.value })}>
                <option value="">-- Choisir --</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom_type}</option>)}
              </select>
            </div>

            <div>
              <Label>Nature</Label>
              <select className="border rounded p-2 w-full" value={editing?.nature_contrat || "emploi"} onChange={e => setEditing({ ...editing, nature_contrat: e.target.value })}>
                <option value="emploi">Contrat de travail</option>
                <option value="mission">Mission</option>
                <option value="prestation">Prestation</option>
              </select>
            </div>

            <div>
              <Label>Statut</Label>
              <select className="border rounded p-2 w-full" value={editing?.status_contrat || "actif"} onChange={e => setEditing({ ...editing, status_contrat: e.target.value })}>
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </div>

            <div>
              <Label>Date début *</Label>
              <Input type="date" value={editing?.date_debut_contrat || ""} onChange={e => setEditing({ ...editing, date_debut_contrat: e.target.value })} />
            </div>

            <div>
              <Label>Date fin</Label>
              <Input type="date" value={editing?.date_fin_contrat || ""} onChange={e => setEditing({ ...editing, date_fin_contrat: e.target.value })} />
            </div>

            <div>
              <Label>Salaire</Label>
              <Input type="number" value={editing?.salaire as any || "0"} onChange={e => setEditing({ ...editing, salaire: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Montant total</Label>
              <Input type="number" value={editing?.montant_total as any || ""} onChange={e => setEditing({ ...editing, montant_total: Number(e.target.value) })} />
            </div>

            <div className="col-span-1 md:col-span-2">
              <Label>Description / Mission</Label>
              <textarea className="border rounded p-2 w-full" value={editing?.description_mission || ""} onChange={e => setEditing({ ...editing, description_mission: e.target.value })} />
            </div>

            <div>
              <Label>Fichier contrat (PDF)</Label>
              <input type="file" accept="application/pdf" onChange={e => setFileToUpload(e.target.files?.[0] || null)} />
              {fileToUpload && <p className="text-sm">Fichier sélectionné : {fileToUpload.name}</p>}
            </div>

          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button onClick={() => { setIsModalOpen(false); setEditing(null); setFileToUpload(null); }}>Annuler</Button>
            <Button onClick={saveContrat}>{editing?.id ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL DRAWER / MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Détails du contrat</DialogTitle></DialogHeader>

          {detailContrat ? (
            <div className="space-y-2">
              <p><strong>Employé :</strong> {detailContrat.employer_nom || (detailContrat as any).employer?.nom}</p>
              <p><strong>Type :</strong> {detailContrat.type_nom || (detailContrat as any).type_contrat?.nom_type || "-"}</p>
              <p><strong>Nature :</strong> {detailContrat.nature_contrat}</p>
              <p><strong>Statut :</strong> <Badge className={STATUS_BADGE(detailContrat.status_contrat)}>{detailContrat.status_contrat}</Badge></p>
              <p><strong>Début :</strong> {detailContrat.date_debut_contrat}</p>
              <p><strong>Fin :</strong> {detailContrat.date_fin_contrat || "-"}</p>
              <p><strong>Durée (jours) :</strong> {detailContrat.duree_jours ?? "-"}</p>
              <p><strong>Salaire :</strong> {detailContrat.salaire ?? "-"}</p>
              <p><strong>Montant total :</strong> {detailContrat.montant_total ?? "-"}</p>
              <p><strong>Description :</strong><br/>{detailContrat.description_mission || "-"}</p>

              {detailContrat.contrat_file && (
                <p>
                  <strong>Fichier :</strong> <a href={detailContrat.contrat_file} target="_blank" rel="noreferrer" className="underline">Télécharger / Ouvrir</a>
                </p>
              )}
            </div>
          ) : (
            <p>Chargement...</p>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL SUPPRESSION */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p>Voulez-vous vraiment supprimer ce contrat ? Cette action est irréversible.</p>
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
