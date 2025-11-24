import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";

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

  const [form, setForm] = useState({
    description: "",
    achatsIds: [] as string[],
    payementsIds: [] as string[],
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [demandesRes, achatsRes, payementsRes] = await Promise.all([
        rhApi.getDemandes(),
        rhApi.getAchats(),
        rhApi.getPayements(),
      ]);

      console.log("RAW ACHATS =", achatsRes?.data);

      setDemandes(demandesRes.data || []);
      setAchats(achatsRes.data || []);
      setPayements(payementsRes.data || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
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
      setForm({
        description: "",
        achatsIds: [],
        payementsIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      description: form.description,
      achats_ids: form.achatsIds,
      payements_ids: form.payementsIds,
    };

    try {
      if (editingDemande) {
        await rhApi.updateDemande(editingDemande.id, payload);
        toast({ title: "Succès", description: "Demande mise à jour." });
      } else {
        await rhApi.createDemande(payload);
        toast({ title: "Succès", description: "Demande créée." });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
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
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.description}</TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline">Approuver</Button>
                    <Button size="sm" variant="destructive">Refuser</Button>
                    <Button size="sm" variant="outline" onClick={() => openModal(d)}>Modifier</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDemande ? "Modifier la Demande" : "Créer une Demande"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <div>
              <label className="font-medium">Achats</label>
              <MultiSelect
                items={achats.map(a => ({
                  value: a.id,
                  label: `${a.article} - ${a.montant} Ar`,
                }))}
                selected={form.achatsIds}
                onChange={(values) => setForm({ ...form, achatsIds: values })}
              />
            </div>

            <div>
              <label className="font-medium">Payements</label>
              <MultiSelect
                items={payements.map(p => ({
                  value: p.id,
                  label: `${p.montant} Ar - ${p.status}`,
                }))}
                selected={form.payementsIds}
                onChange={(values) => setForm({ ...form, payementsIds: values })}
              />
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
