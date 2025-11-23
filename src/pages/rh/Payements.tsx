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

interface ModePayement {
  id: string;
  mode_payement: string;
  description?: string;
}

interface Location { id: string; nom?: string; name?: string; label?: string; }
interface Electricite {
  id?: string;
  numero_compteur: string;
  fournisseur: string;
  location?: Location;
}


interface Contrat {
  id: string;
  employer_nom?: string;
  salaire?: number;                    // ← ajouté selon ton backend
}

interface Payement {
  id?: string;
  reference?: string;   // ← ICI !
  montant?: number;
  status: string;
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

      setModes(m);
      setLocations(l);
      setElectricites(e);
      setContrats(c);

      setPayements(p);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les paiements.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleOpenModal = (payement?: Payement) => {
    if (payement) {
      setEditingPayement(payement);
      setForm({
        ...payement,
        mode_payement: payement.mode_payement || undefined,
        location: payement.location || undefined,
        electricite: payement.electricite || undefined,
        contrat: payement.contrat || undefined,
      });
    } else {
      setEditingPayement(null);
      setForm({
        montant: 0,
        status: "en_attente",
        mode_payement: undefined,
        location: undefined,
        electricite: undefined,
        contrat: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayement(null);
    setForm({
      montant: 0,
      status: "en_attente",
      mode_payement: undefined,
      location: undefined,
      electricite: undefined,
      contrat: undefined,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.location && !form.electricite && !form.contrat) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins Location, Électricité ou Contrat.", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        montant: form.montant,
        status: form.status,
        mode_payement_id: form.mode_payement?.id || null,
        location_id: form.location?.id || null,
        electricite_id: form.electricite?.id || null,
        contrat_id: form.contrat?.id || null,
      };

      if (editingPayement) {
        await rhApi.updatePayement(editingPayement.id!, payload);
        toast({ title: "Succès", description: "Paiement mis à jour." });
      } else {
        await rhApi.createPayement(payload);
        toast({ title: "Succès", description: "Paiement créé." });
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'opération.", variant: "destructive" });
    }
  };

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const handleOpenDetailModal = (payement: Payement) => {
      setEditingPayement(payement);
      setIsDetailModalOpen(true);
    };



  const handleOpenDeleteModal = (id: string) => { setSelectedIdToDelete(id); setIsDeleteModalOpen(true); };
  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      await rhApi.deletePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Paiement supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally { setSelectedIdToDelete(null); }
  };

  const filteredPayements = payements.filter(p =>
    (p.montant?.toString().includes(searchTerm) ?? false) ||
    (p.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.mode_payement?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ??
     p.mode_payement?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
     false)
  );

  const exportPDF = async () => {
    const data = filteredPayements.map(p => [
      p.montant ?? "-",
      p.status,
      p.mode_payement?.mode_payement ?? "-",
      p.location?.nom ?? p.location?.name ?? "-",
      p.electricite? `${p.electricite.numero_compteur} (${p.electricite.fournisseur})` : "-",

      p.contrat?.employer_nom ?? "-",
    ]);
    const columns = ["Montant", "Status", "Mode", "Location", "Électricité", "Contrat"];
    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map(p => ({
        Montant: p.montant ?? "-",
        Status: p.status,
        Mode: p.mode_payement?.nom ?? p.mode_payement?.name ?? "-",
        Location: p.location?.nom ?? p.location?.name ?? "-",
        Electricite: p.electricite?.nom ?? p.electricite?.name ?? "-",
        Contrat: p.contrat?.employer_nom ?? "-",
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
        <Input placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
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
                  <TableCell className="text-center">{p.montant ?? "-"}</TableCell>
                  <TableCell className="text-center">{p.status}</TableCell>
                  <TableCell className="text-center">
                    {p.mode_payement?.mode_payement ?? "-"}
                  </TableCell>

                  <TableCell className="text-center">{p.location?.nom ?? p.location?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">
                    {p.electricite?.numero_compteur ?? "-"} ({p.electricite?.fournisseur ?? ""})
                  </TableCell>


                  <TableCell className="text-center">
                    {p.contrat
                      ? `${p.contrat.employer_nom } - ${p.contrat.salaire?.toLocaleString()} Ar`
                      : "-"}
                  </TableCell>


                  <TableCell className="text-center space-x-2">
                    <Button size="sm" variant="default" onClick={() => handleOpenDetailModal(p)}>Détails</Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(p)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(p.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">Aucun paiement trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajout/Modification ------------------------------------------------ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPayement ? "Modifier le paiement" : "Créer un paiement"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Montant */}
          

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
              >
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
              <Select
                value={form.mode_payement?.id ?? "null"}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    mode_payement: val === "null"
                      ? undefined
                      : modes.find((m) => m.id === val),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucun</SelectItem>
                  {modes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.mode_payement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label>Location</Label>
              <Select
                value={form.location?.id ?? "null"}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    location: val === "null"
                      ? undefined
                      : locations.find((l) => l.id === val),
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="Choisir une location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucune</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nom ?? l.name ?? l.label ?? ("Location " + l.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Électricité */}
            {/* Électricité */}
            <div>
              <Label>Électricité</Label>
              <Select
                value={form.electricite?.id ?? "null"}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    electricite: val === "null" ? undefined : electricites.find((e) => e.id === val),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucune</SelectItem>
                  {electricites.map((e) => (
                    <SelectItem key={e.id} value={e.id!}>
                      {e.numero_compteur} ({e.fournisseur})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>


            <div>
              <Label>Salaire</Label>
              <Select
                value={form.contrat?.id ?? "null"}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    contrat:
                      val === "null"
                        ? undefined
                        : contrats.find((c) => c.id === val),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Aucun</SelectItem>
                  {contrats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.employer_nom} — {c.salaire?.toLocaleString()} Ar
                    </SelectItem>
                  ))}
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

      {/* Modal Suppression ----------------------------------------------------- */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Détails du paiement</DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      <p><strong>Référence :</strong> {editingPayement?.reference}</p>
      <p><strong>Montant :</strong> {editingPayement?.montant ?? "-"}</p>
      <p><strong>Status :</strong> {editingPayement?.status}</p>
      <p><strong>Mode de paiement :</strong> {editingPayement?.mode_payement?.mode_payement ?? "-"}</p>
      <p><strong>Location :</strong> {editingPayement?.location?.nom ?? editingPayement?.location?.name ?? "-"}</p>
      <p><strong>Électricité :</strong> {editingPayement?.electricite?.numero_compteur ?? "-"} ({editingPayement?.electricite?.fournisseur ?? ""})</p>
      <p><strong>Salaire :</strong> {editingPayement?.contrat ? `${editingPayement.contrat.employer_nom} - ${editingPayement.contrat.salaire?.toLocaleString()} Ar` : "-"}</p>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fermer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


    </div>
  );
};

export default Payements;
