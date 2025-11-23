import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

// Interfaces
interface ModePayement { id: string; mode_payement: string; }
interface SimpleLocation { id: string; nom?: string; }
interface SimpleElectricite { id: string; numero_compteur?: string; }
interface SimpleContrat { id: string; }
interface Payement {
  id?: string;
  montant?: number;
  date_payement?: string;
  status?: string;
  reference?: string;
  mode_payement?: ModePayement | null;
  mode_payement_id?: string | null;
  location?: SimpleLocation | null;
  location_id?: string | null;
  electricite?: SimpleElectricite | null;
  electricite_id?: string | null;
  contrat?: SimpleContrat | null;
  contrat_id?: string | null;
}

// Component
const PayementsPage: React.FC = () => {
  const { toast } = useToast();
  const [payements, setPayements] = useState<Payement[]>([]);
  const [modesPayement, setModesPayement] = useState<ModePayement[]>([]);
  const [locations, setLocations] = useState<SimpleLocation[]>([]);
  const [electricites, setElectricites] = useState<SimpleElectricite[]>([]);
  const [contrats, setContrats] = useState<SimpleContrat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayement, setEditingPayement] = useState<Payement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Payement>({
    montant: undefined,
    mode_payement_id: "",
    location_id: "",
    electricite_id: "",
    contrat_id: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [payments, modes, locs, elecs, conts] = await Promise.all([
        rhApi.getPayements(),
        rhApi.getModePayements(),
        rhApi.getLocations(),
        rhApi.getElectricites(),
        rhApi.getContrats(),
      ]);
      setPayements(payments || []);
      setModesPayement(modes || []);
      setLocations(locs || []);
      setElectricites(elecs || []);
      setContrats(conts || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les données.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleOpenModal = (p?: Payement) => {
    if (p) {
      setEditingPayement(p);
      setForm({
        montant: p.montant,
        mode_payement_id: p.mode_payement?.id || "",
        location_id: p.location?.id || "",
        electricite_id: p.electricite?.id || "",
        contrat_id: p.contrat?.id || "",
      });
    } else {
      setEditingPayement(null);
      setForm({ montant: undefined, mode_payement_id: "", location_id: "", electricite_id: "", contrat_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingPayement(null); };

  const buildPayload = (f: Payement) => {
    const payload: any = {};
    if (f.montant != null && !Number.isNaN(f.montant)) payload.montant = f.montant;
    if (f.mode_payement_id) payload.mode_payement_id = f.mode_payement_id;
    if (f.location_id) payload.location_id = f.location_id;
    if (f.electricite_id) payload.electricite_id = f.electricite_id;
    if (f.contrat_id) payload.contrat_id = f.contrat_id;
    return payload;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.montant || !form.mode_payement_id) {
      toast({ title: "Erreur", description: "Montant et mode de paiement sont obligatoires.", variant: "destructive" });
      return;
    }
    if (!form.location_id && !form.electricite_id && !form.contrat_id) {
      toast({ title: "Erreur", description: "Au moins : location, électricité ou contrat doit être renseigné.", variant: "destructive" });
      return;
    }
    try {
      const payload = buildPayload(form);
      if (editingPayement?.id) {
        await rhApi.updatePayement(editingPayement.id, payload);
        toast({ title: "Succès", description: "Paiement mis à jour." });
      } else {
        await rhApi.createPayement(payload);
        toast({ title: "Succès", description: "Paiement créé." });
      }
      handleCloseModal();
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de l'opération.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      await rhApi.deletePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Paiement supprimé." });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de suppression.", variant: "destructive" });
    } finally { setIsDeleteModalOpen(false); setSelectedIdToDelete(null); }
  };

  const filteredPayements = payements.filter((p) =>
    (p.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.mode_payement?.mode_payement || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location?.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.electricite?.numero_compteur || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    const data = filteredPayements.map((p) => [
      p.reference || "", p.montant ?? "", p.status || "",
      p.mode_payement?.mode_payement || "", p.location?.nom || "",
      p.electricite?.numero_compteur || "", p.contrat?.id || ""
    ]);
    const columns = ["Référence", "Montant", "Statut", "Mode", "Location", "Électricité", "Contrat"];
    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map((p) => ({
        Référence: p.reference || "",
        Montant: p.montant ?? "",
        Statut: p.status || "",
        Mode: p.mode_payement?.mode_payement || "",
        Location: p.location?.nom || "",
        "Électricité": p.electricite?.numero_compteur || "",
        Contrat: p.contrat?.id || "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payements");
    XLSX.writeFile(workbook, "payements.xlsx");
  };

  if (isLoading) return <p className="text-center p-8">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un paiement</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par référence / mode / location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={exportPDF}>Exporter PDF</Button>
        <Button variant="outline" onClick={exportExcel}>Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Liste des Paiements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {["Référence","Montant","Statut","Mode","Location","Électricité","Contrat","Actions"].map((h) =>
                  <TableHead key={h} className="text-center">{h}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayements.length ? filteredPayements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">{p.reference || "-"}</TableCell>
                  <TableCell className="text-center">{p.montant ?? "-"}</TableCell>
                  <TableCell className="text-center">{p.status || "-"}</TableCell>
                  <TableCell className="text-center">{p.mode_payement?.mode_payement || "-"}</TableCell>
                  <TableCell className="text-center">{p.location?.nom || "-"}</TableCell>
                  <TableCell className="text-center">{p.electricite?.numero_compteur || "-"}</TableCell>
                  <TableCell className="text-center">{p.contrat?.id || "-"}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(p)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedIdToDelete(p.id || null); setIsDeleteModalOpen(true); }}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={8} className="text-center py-6">Aucun paiement trouvé.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Création / Modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingPayement ? "Modifier le Paiement" : "Créer un Paiement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="montant">Montant</Label>
              <Input
                id="montant"
                type="number"
                value={form.montant ?? ""}
                onChange={(e) => setForm({ ...form, montant: e.target.value ? Number(e.target.value) : undefined })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mode">Mode de paiement</Label>
              <select
                id="mode"
                className="w-full border rounded p-2"
                value={form.mode_payement_id || ""}
                onChange={(e) => setForm({ ...form, mode_payement_id: e.target.value })}
                required
              >
                <option value="">-- Sélectionner un mode --</option>
                {modesPayement.map((m) => <option key={m.id} value={m.id}>{m.mode_payement}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="location">Location (optionnel)</Label>
              <select
                id="location"
                className="w-full border rounded p-2"
                value={form.location_id || ""}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              >
                <option value="">-- Aucune --</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="electricite">Électricité (optionnel)</Label>
              <select
                id="electricite"
                className="w-full border rounded p-2"
                value={form.electricite_id || ""}
                onChange={(e) => setForm({ ...form, electricite_id: e.target.value })}
              >
                <option value="">-- Aucune --</option>
                {electricites.map((el) => <option key={el.id} value={el.id}>{el.numero_compteur}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="contrat">Contrat (optionnel)</Label>
              <select
                id="contrat"
                className="w-full border rounded p-2"
                value={form.contrat_id || ""}
                onChange={(e) => setForm({ ...form, contrat_id: e.target.value })}
              >
                <option value="">-- Aucun --</option>
                {contrats.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit">{editingPayement ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="py-2">Cette action est irréversible. Voulez-vous continuer ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayementsPage;
