// src/pages/rh/Demandes.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
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

// Fonction utilitaire pour extraire la liste depuis l’API
const extractList = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.results && Array.isArray(response.results)) return response.results;
  return [];
};

// 🎨 Fonction utilitaire pour donner la bonne couleur selon le statut
const badgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approuve":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    case "non_demande":
      return "bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
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

  // -----------------
  // Filtre search
  // -----------------
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
                <TableHead>Détails</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDemandes.length ? filteredDemandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.description}</TableCell>

                  {/* 🎨 STATUS DEMANDE */}
                  <TableCell>
                    <span className={badgeColor(d.status)}>
                      {d.status}
                    </span>
                  </TableCell>

                  <TableCell>{d.montant.toLocaleString()} Ar</TableCell>

                  {/* ----------------- */}
                  {/* Détails Achats / Payements */}
                  {/* ----------------- */}
                  <TableCell>
                    <div className="mb-2">
                      <strong>Achats :</strong>
                      <ul className="ml-4 list-disc">
                        {d.achats.map(a => (
                          <li key={a.id}>
                            {a.article} - {a.nombre} x {a.montant.toLocaleString()} Ar 
                            {" "}
                            <span className={badgeColor(a.statut)}>
                              {a.statut}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Payements :</strong>
                      <ul className="ml-4 list-disc">
                        {d.payements.map(p => (
                          <li key={p.id}>
                            {p.montant.toLocaleString()} Ar 
                            {" "}
                            <span className={badgeColor(p.status)}>
                              {p.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TableCell>

                  {/* ----------------- */}
                  {/* Actions */}
                  {/* ----------------- */}
                  <TableCell className="space-x-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await rhApi.approveDemande(d.id);
                          toast({ title: "Succès", description: "Demande approuvée." });
                          fetchData();
                        } catch (err: any) {
                          toast({ title: "Erreur", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      Approuver
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await rhApi.rejectDemande(d.id);
                          toast({ title: "Succès", description: "Demande refusée." });
                          fetchData();
                        } catch (err: any) {
                          toast({ title: "Erreur", description: err.message, variant: "destructive" });
                        }
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
                        try {
                          await rhApi.deleteDemande(d.id);
                          toast({ title: "Supprimée", description: "La demande a été supprimée." });
                          fetchData();
                        } catch (err: any) {
                          toast({ title: "Erreur", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      Supprimer
                    </Button>

                  </TableCell>

                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Aucune demande trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

          </Table>
        </CardContent>
      </Card>

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

            {/* Achats */}
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

            {/* Payements */}
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
