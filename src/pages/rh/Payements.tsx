// src/pages/rh/Payements.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

interface ModePayement { id: string; mode_payement: string; description?: string; }
interface Location { id: string; nom?: string; name?: string; label?: string; montant?: number; }
interface Electricite { id?: string; numero_compteur: string; fournisseur: string; montant?: number; location?: Location; }
interface Contrat { id: string; employer_nom?: string; salaire?: number; }
interface Payement {
  id?: string;
  reference?: string;
  montant?: number;
  status: string;
  paiement_type?: "total" | "avance";
  mode_payement?: ModePayement;
  location?: Location;
  electricite?: Electricite;
  contrat?: Contrat;
}

const Payements = () => {
  const [payements, setPayements] = useState<Payement[]>([]);
  const [modes, setModes] = useState<ModePayement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [electricites, setElectricites] = useState<Electricite[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPayement, setEditingPayement] = useState<Payement | null>(null);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState<Payement>({
    montant: 0,
    status: "en_attente",
    paiement_type: "total",
    mode_payement: undefined,
    location: undefined,
    electricite: undefined,
    contrat: undefined,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [p, m, l, e, c] = await Promise.all([
        rhApi.getPayements(),
        rhApi.getModePayements(),
        rhApi.getLocations(),
        rhApi.getElectricites(),
        rhApi.getContrats(),
      ]);
      setModes(m); setLocations(l); setElectricites(e); setContrats(c);
      setPayements(p);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les paiements.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const calculateMontant = (p: Payement) => {
    let total = 0;
    if (p.location?.montant) total += p.location.montant;
    if (p.electricite?.montant) total += p.electricite.montant;
    if (p.contrat?.salaire) total += p.contrat.salaire;
    if (p.paiement_type === "avance") total = total * 0.3; // 30% d'avance
    return total;
  };

  const handleOpenModal = (payement?: Payement) => {
    if (payement) {
      setEditingPayement(payement);
      setForm({ ...payement, montant: calculateMontant(payement) });
    } else {
      setEditingPayement(null);
      setForm({ montant: 0, status: "en_attente", paiement_type: "total" });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingPayement(null); };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.location && !form.electricite && !form.contrat) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins Location, Électricité ou Contrat.", variant: "destructive" });
      return;
    }

    try {
      const payload: any = {
        montant: form.montant,
        status: form.status,
        paiement_type: form.paiement_type,
        mode_payement_id: form.mode_payement?.id || null,
        location_id: form.location?.id || null,
        electricite_id: form.electricite?.id || null,
        contrat_id: form.contrat?.id || null,
      };
      if (editingPayement) await rhApi.updatePayement(editingPayement.id!, payload);
      else await rhApi.createPayement(payload);

      toast({ title: "Succès", description: editingPayement ? "Paiement mis à jour." : "Paiement créé." });
      handleCloseModal(); fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'opération.", variant: "destructive" });
    }
  };

  const handleOpenDeleteModal = (id: string) => { setSelectedIdToDelete(id); setIsDeleteModalOpen(true); };
  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try { setIsDeleteModalOpen(false); await rhApi.deletePayement(selectedIdToDelete); toast({ title: "Succès", description: "Paiement supprimé." }); fetchData(); }
    catch (err: any) { toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" }); }
    finally { setSelectedIdToDelete(null); }
  };

  const filteredPayements = payements.filter(p =>
    (p.montant?.toString().includes(searchTerm) ?? false) ||
    (p.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.mode_payement?.mode_payement?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const exportPDF = async () => {
    const data = filteredPayements.map(p => [
      p.montant ?? "-", p.status, p.paiement_type === "avance" ? "Avance" : "Total",
      p.mode_payement?.mode_payement ?? "-",
      p.location?.nom ?? p.location?.name ?? "-",
      p.electricite ? `${p.electricite.numero_compteur} (${p.electricite.fournisseur})` : "-",
      p.contrat?.employer_nom ?? "-"
    ]);
    const columns = ["Montant", "Status", "Type", "Mode", "Location", "Électricité", "Contrat"];
    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map(p => ({
        Montant: p.montant ?? "-", Status: p.status,
        Type: p.paiement_type === "avance" ? "Avance" : "Total",
        Mode: p.mode_payement?.mode_payement ?? "-", Location: p.location?.nom ?? p.location?.name ?? "-",
        Electricite: p.electricite?.numero_compteur ?? "-", Contrat: p.contrat?.employer_nom ?? "-"
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payements");
    XLSX.writeFile(workbook, "payements.xlsx");
  };

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un Paiement</Button>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1" />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Liste des Paiements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Référence</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Mode</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Électricité</TableHead>
                <TableHead className="text-center">Salaire</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayements.length ? filteredPayements.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">{p.reference}</TableCell>
                  <TableCell className="text-center">{p.montant?.toLocaleString() ?? "-"}</TableCell>
                  <TableCell className="text-center">{p.paiement_type === "avance" ? "Avance" : "Total"}</TableCell>
                  <TableCell className="text-center">{p.status}</TableCell>
                  <TableCell className="text-center">{p.mode_payement?.mode_payement ?? "-"}</TableCell>
                  <TableCell className="text-center">{p.location?.nom ?? p.location?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{p.electricite?.numero_compteur ?? "-"} ({p.electricite?.fournisseur ?? ""})</TableCell>
                  <TableCell className="text-center">{p.contrat ? `${p.contrat.employer_nom} - ${p.contrat.salaire?.toLocaleString()} Ar` : "-"}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="default" onClick={() => handleOpenModal(p)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(p.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={9} className="text-center py-6">Aucun paiement trouvé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajout/Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingPayement ? "Modifier le paiement" : "Créer un paiement"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paiement type */}
            <div>
              <Label>Type de paiement</Label>
              <Select value={form.paiement_type ?? "total"} onValueChange={val => setForm({ ...form, paiement_type: val as "total" | "avance", montant: calculateMontant({ ...form, paiement_type: val as "total" | "avance" }) })}>
                <SelectTrigger><SelectValue placeholder="Choisir le type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Paiement total</SelectItem>
                  <SelectItem value="avance">Avance / Tranche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={val => setForm({ ...form, status: val })}>
                <SelectTrigger><SelectValue placeholder="Choisir le status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="complete">Complété</SelectItem>
                  <SelectItem value="echoue">Échoué</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode de paiement */}
            <div>
              <Label>Mode de paiement</Label>
              <Select value={form.mode_payement?.id ?? "null"} onValueChange={val => setForm({ ...form, mode_payement: val === "null" ? undefined : modes.find(m => m.id === val) })}>
                <SelectTrigger><SelectValue placeholder="Choisir un mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucun</SelectItem>
                  {modes.map(m => <SelectItem key={m.id} value={m.id}>{m.mode_payement}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label>Location</Label>
              <Select value={form.location?.id ?? "null"} onValueChange={val => setForm({ ...form, location: val === "null" ? undefined : locations.find(l => l.id === val), montant: calculateMontant({ ...form, location: val === "null" ? undefined : locations.find(l => l.id === val) }) })}>
                <SelectTrigger><SelectValue placeholder="Choisir une location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucune</SelectItem>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.nom ?? l.name ?? l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Electricité */}
            <div>
              <Label>Électricité</Label>
              <Select value={form.electricite?.id ?? "null"} onValueChange={val => setForm({ ...form, electricite: val === "null" ? undefined : electricites.find(e => e.id === val), montant: calculateMontant({ ...form, electricite: val === "null" ? undefined : electricites.find(e => e.id === val) }) })}>
                <SelectTrigger><SelectValue placeholder="Choisir un compteur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucune</SelectItem>
                  {electricites.map(e => <SelectItem key={e.id!} value={e.id!}>{e.numero_compteur} ({e.fournisseur})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Contrat */}
            <div>
              <Label>Salaire</Label>
              <Select value={form.contrat?.id ?? "null"} onValueChange={val => setForm({ ...form, contrat: val === "null" ? undefined : contrats.find(c => c.id === val), montant: calculateMontant({ ...form, contrat: val === "null" ? undefined : contrats.find(c => c.id === val) }) })}>
                <SelectTrigger><SelectValue placeholder="Choisir un contrat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucun</SelectItem>
                  {contrats.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_nom} — {c.salaire?.toLocaleString()} Ar</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingPayement ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce paiement ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payements;
