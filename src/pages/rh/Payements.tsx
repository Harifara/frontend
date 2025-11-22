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
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

// ======================= INTERFACES =========================
interface ModePayement {
  id: string;
  mode_payement: string;
}

interface SimpleObject {
  id: string;
  nom?: string;
  numero_compteur?: string;
}

interface Payement {
  id?: string;
  montant?: number;
  date_payement?: string;
  status?: string;
  reference?: string;
  mode_payement?: ModePayement;
  mode_payement_id?: string;
  location_id?: string;
  electricite_id?: string;
  contrat_id?: string;
  location?: SimpleObject;
  electricite?: SimpleObject;
  contrat?: SimpleObject;
}

// ======================= COMPONENT =========================
const PayementsPage = () => {
  const [payements, setPayements] = useState<Payement[]>([]);
  const [modesPayement, setModesPayement] = useState<ModePayement[]>([]);
  const [locations, setLocations] = useState<SimpleObject[]>([]);
  const [electricites, setElectricites] = useState<SimpleObject[]>([]);
  const [contrats, setContrats] = useState<SimpleObject[]>([]);

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

  const { toast } = useToast();

  // ======================= FETCH =========================
  useEffect(() => {
    fetchAll();
  }, []);

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
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ======================= MODAL =========================
  const handleOpenModal = (payement?: Payement) => {
    if (payement) {
      setEditingPayement(payement);
      setForm({
        montant: payement.montant,
        mode_payement_id: payement.mode_payement?.id || "",
        location_id: payement.location?.id || "",
        electricite_id: payement.electricite?.id || "",
        contrat_id: payement.contrat?.id || "",
      });
    } else {
      setEditingPayement(null);
      setForm({
        montant: undefined,
        mode_payement_id: "",
        location_id: "",
        electricite_id: "",
        contrat_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.montant || !form.mode_payement_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPayement) {
        await rhApi.updatePayement(editingPayement.id!, form);
        toast({ title: "Succès", description: "Paiement mis à jour." });
      } else {
        await rhApi.createPayement(form);
        toast({ title: "Succès", description: "Paiement créé." });
      }

      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de l'opération.",
        variant: "destructive",
      });
    }
  };

  // ======================= DELETE =========================
  const handleDelete = async () => {
    if (!selectedIdToDelete) return;

    try {
      await rhApi.deletePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Paiement supprimé." });
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de suppression.",
        variant: "destructive",
      });
    }
    setIsDeleteModalOpen(false);
  };

  // ======================= FILTER =========================
  const filteredPayements = payements.filter((p) =>
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mode_payement?.mode_payement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ======================= EXPORT =========================
  const exportPDF = async () => {
    const data = filteredPayements.map((p) => [
      p.reference,
      p.montant,
      p.status,
      p.mode_payement?.mode_payement || "",
      p.location?.nom || "",
      p.electricite?.numero_compteur || "",
      p.contrat?.id || "",
    ]);

    const columns = [
      "Référence",
      "Montant",
      "Statut",
      "Mode de Paiement",
      "Location",
      "Électricité",
      "Contrat",
    ];

    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map((p) => ({
        Référence: p.reference,
        Montant: p.montant,
        Statut: p.status,
        "Mode de Paiement": p.mode_payement?.mode_payement || "",
        Location: p.location?.nom || "",
        "Électricité": p.electricite?.numero_compteur || "",
        Contrat: p.contrat?.id || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "payements.xlsx");
  };

  // ======================= RENDER =========================
  if (isLoading) return <p className="text-center p-8">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <Button onClick={() => handleOpenModal()}>Ajouter un paiement</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher un paiement…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={exportPDF}>
          PDF
        </Button>
        <Button variant="outline" onClick={exportExcel}>
          Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Référence</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Mode</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Électricité</TableHead>
                <TableHead className="text-center">Contrat</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredPayements.length ? (
                filteredPayements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-center">{p.reference}</TableCell>
                    <TableCell className="text-center">{p.montant}</TableCell>
                    <TableCell className="text-center">{p.status}</TableCell>
                    <TableCell className="text-center">{p.mode_payement?.mode_payement}</TableCell>
                    <TableCell className="text-center">{p.location?.nom || "-"}</TableCell>
                    <TableCell className="text-center">{p.electricite?.numero_compteur || "-"}</TableCell>
                    <TableCell className="text-center">{p.contrat?.id || "-"}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(p)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedIdToDelete(p.id!);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    Aucun résultat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ======================= MODAL AJOUT/EDIT ======================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayement ? "Modifier le Paiement" : "Créer un Paiement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Montant</Label>
              <Input
                type="number"
                value={form.montant || ""}
                onChange={(e) =>
                  setForm({ ...form, montant: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <Label>Mode de Paiement</Label>
              <select
                className="w-full border rounded p-2"
                value={form.mode_payement_id}
                onChange={(e) =>
                  setForm({ ...form, mode_payement_id: e.target.value })
                }
                required
              >
                <option value="">-- Sélectionner --</option>
                {modesPayement.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mode_payement}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Location</Label>
              <select
                className="w-full border rounded p-2"
                value={form.location_id}
                onChange={(e) =>
                  setForm({ ...form, location_id: e.target.value })
                }
              >
                <option value="">-- Aucune --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Électricité</Label>
              <select
                className="w-full border rounded p-2"
                value={form.electricite_id}
                onChange={(e) =>
                  setForm({ ...form, electricite_id: e.target.value })
                }
              >
                <option value="">-- Aucune --</option>
                {electricites.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.numero_compteur}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Contrat</Label>
              <select
                className="w-full border rounded p-2"
                value={form.contrat_id}
                onChange={(e) =>
                  setForm({ ...form, contrat_id: e.target.value })
                }
              >
                <option value="">-- Aucun --</option>
                {contrats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">{editingPayement ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= MODAL DELETE ======================= */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Cette action est définitive.</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayementsPage;
