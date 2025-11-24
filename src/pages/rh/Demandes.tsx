// src/pages/rh/Demandes.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Achat { id: string; article: string; montant: number; nombre: number; statut: string }
interface Payement { id: string; montant: number; status: string }
interface Demande {
  id: string;
  description: string;
  status: string;
  achats: Achat[];
  payements: Payement[];
  montant: number;
}

const Demandes = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [payements, setPayements] = useState<Payement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDemande, setEditingDemande] = useState<Demande | null>(null);
  const [form, setForm] = useState<{ description: string; achatsIds: string[]; payementsIds: string[] }>({
    description: "",
    achatsIds: [],
    payementsIds: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dataDemandes, dataAchats, dataPayements] = await Promise.all([
        rhApi.getDemandes(),
        rhApi.getAchats(),
        rhApi.getPayements(),
      ]);
      setDemandes(dataDemandes);
      setAchats(dataAchats);
      setPayements(dataPayements);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await rhApi.approveDemande(id);
      toast({ title: "Succès", description: "Demande approuvée." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'approbation.", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rhApi.rejectDemande(id);
      toast({ title: "Succès", description: "Demande refusée." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors du rejet.", variant: "destructive" });
    }
  };

  const openModal = (demande?: Demande) => {
    if (demande) {
      setEditingDemande(demande);
      setForm({
        description: demande.description,
        achatsIds: demande.achats.map(a => a.id),
        payementsIds: demande.payements.map(p => p.id),
      });
    } else {
      setEditingDemande(null);
      setForm({ description: "", achatsIds: [], payementsIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDemande) {
        await rhApi.updateDemande(editingDemande.id, {
          description: form.description,
          achats_ids: form.achatsIds,
          payements_ids: form.payementsIds,
        });
        toast({ title: "Succès", description: "Demande mise à jour." });
      } else {
        await rhApi.createDemande({
          description: form.description,
          achats_ids: form.achatsIds,
          payements_ids: form.payementsIds,
        });
        toast({ title: "Succès", description: "Demande créée." });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'enregistrement.", variant: "destructive" });
    }
  };

  const filteredDemandes = demandes.filter(d =>
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandes</h1>
        <Button onClick={() => openModal()}>Ajouter une Demande</Button>
      </div>

      <Input
        placeholder="Rechercher par description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des Demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemandes.length ? filteredDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.description}</TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>{d.montant}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(d.id)}>Approuver</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(d.id)}>Refuser</Button>
                    <Button size="sm" variant="outline" onClick={() => openModal(d)}>Modifier</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">Aucune demande trouvée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDemande ? "Modifier la demande" : "Créer une demande"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <div>
              <label>Achats</label>
              <Select
                multiple
                value={form.achatsIds}
                onValueChange={(values: string[]) => setForm({ ...form, achatsIds: values })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner les achats" />
                </SelectTrigger>
                <SelectContent>
                  {achats.map(a => <SelectItem key={a.id} value={a.id}>{a.article} - {a.montant}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Payements</label>
              <Select
                multiple
                value={form.payementsIds}
                onValueChange={(values: string[]) => setForm({ ...form, payementsIds: values })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner les payements" />
                </SelectTrigger>
                <SelectContent>
                  {payements.map(p => <SelectItem key={p.id} value={p.id}>{p.montant} - {p.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button type="submit">{editingDemande ? "Mettre à jour" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Demandes;
