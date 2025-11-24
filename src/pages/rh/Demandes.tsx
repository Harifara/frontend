// src/pages/rh/Demandes.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";

// ------------------
// Types
// ------------------
interface Achat { 
  id: string; 
  article: string; 
  montant: number; 
  nombre: number; 
  statut: string 
}

interface Payement { 
  id: string; 
  montant: number; 
  status: string 
}

interface Demande {
  id: string;
  description: string;
  status: string;
  achats: Achat[];
  payements: Payement[];
  montant: number;
}

const extractList = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.results && Array.isArray(response.results)) return response.results;
  return [];
};

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

  // -----------------
  // Fetch initial data
  // -----------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [demandesRes, achatsRes, payementsRes] = await Promise.all([
        rhApi.getDemandes(),
        rhApi.getAchats(),
        rhApi.getPayements(),
      ]);

      setDemandes(extractList(demandesRes));
      setAchats(extractList(achatsRes));
      setPayements(extractList(payementsRes));
      
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -----------------
  // Modal open
  // -----------------
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

  // -----------------
  // Submit (create/update)
  // -----------------
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
        className="mb-6"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDemandes.length ? filteredDemandes.map(d => (
          <Card key={d.id} className="rounded-xl shadow-md border p-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{d.description}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Status:</strong> {d.status}</p>
              <p><strong>Montant total:</strong> {d.montant.toLocaleString()} Ar</p>

              <div>
                <strong>Achats :</strong>
                <ul className="ml-4 list-disc">
                  {d.achats.map(a => (
                    <li key={a.id}>
                      {a.article} - {a.nombre} x {a.montant.toLocaleString()} Ar ({a.statut})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <strong>Payements :</strong>
                <ul className="ml-4 list-disc">
                  {d.payements.map(p => (
                    <li key={p.id}>
                      {p.montant.toLocaleString()} Ar - {p.status}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try { await rhApi.approveDemande(d.id); toast({ title: "Succès", description: "Demande approuvée." }); fetchData(); }
                    catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
                  }}
                >
                  Approuver
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try { await rhApi.rejectDemande(d.id); toast({ title: "Succès", description: "Demande refusée." }); fetchData(); }
                    catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
                  }}
                >
                  Refuser
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(d)}
                >
                  Modifier
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm("Voulez-vous vraiment supprimer cette demande ?")) return;
                    try { await rhApi.deleteDemande(d.id); toast({ title: "Supprimée", description: "La demande a été supprimée." }); fetchData(); }
                    catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <p className="col-span-full text-center py-6">Aucune demande trouvée.</p>
        )}
      </div>

      {/* -------------------- */}
      {/* Modal Création / Modification */}
      {/* -------------------- */}
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
                items={achats.map(a => ({ value: a.id, label: `${a.article} - ${a.montant} Ar` }))}
                selected={form.achatsIds}
                onChange={(values) => setForm({ ...form, achatsIds: values })}
              />
            </div>

            <div>
              <label className="font-medium">Payements</label>
              <MultiSelect
                items={payements.map(p => ({ value: p.id, label: `${p.montant} Ar - ${p.status}` }))}
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
