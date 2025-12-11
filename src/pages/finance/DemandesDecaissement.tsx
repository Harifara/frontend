// src/pages/finance/DecaissementsPage.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ------------------
// Types
// ------------------
interface Achat { 
  id: string; 
  article: string; 
  montant: number; 
  nombre: number; 
  statut: string;
}

interface Payement { 
  id: string; 
  montant: number; 
  status: string;
}

interface Depense { 
  description: string; 
  montant: number;
}

interface Demande {
  id: string;
  source: "RH" | "Stock";
  description: string;
  montant: number;
  status: string;
  achats: Achat[];
  payements: Payement[];
  depenses?: Depense[];
}

// ------------------
// Badge couleur
// ------------------
const badgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approuve":
    case "valide":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en_attente":
    case "en attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

// ------------------
// Composant
// ------------------
const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsDemande, setDetailsDemande] = useState<Demande | null>(null);
  const [openNewDemande, setOpenNewDemande] = useState(false);
  const { toast } = useToast();

  // -----------------
  // Formulaire création demande
  // -----------------
  const [newDemande, setNewDemande] = useState<{ source_service: "RH" | "Stock"; depenses: Depense[] }>({
    source_service: "RH",
    depenses: [{ description: "", montant: 0 }]
  });

  const [availableAchats, setAvailableAchats] = useState<Achat[]>([]);
  const [selectedAchats, setSelectedAchats] = useState<Achat[]>([]);

  // -----------------
  // Gestion des dépenses
  // -----------------
  const addDepense = () => setNewDemande(prev => ({ ...prev, depenses: [...prev.depenses, { description: "", montant: 0 }] }));
  const removeDepense = (index: number) => setNewDemande(prev => ({ ...prev, depenses: prev.depenses.filter((_, i) => i !== index) }));

  const handleDepenseChange = (index: number, field: "description" | "montant", value: string | number) => {
    const depenses = [...newDemande.depenses];
    depenses[index][field] = field === "montant" ? Number(value) : String(value);
    setNewDemande(prev => ({ ...prev, depenses }));
  };

  // -----------------
  // Création demande
  // -----------------
  const handleCreateDemande = async () => {
    try {
      await financeApi.createDemande({
        ...newDemande,
        created_by: userId,
        achats: selectedAchats
      });
      toast({ title: "Succès", description: "Demande créée", variant: "success" });
      setOpenNewDemande(false);
      setNewDemande({ source_service: "RH", depenses: [{ description: "", montant: 0 }] });
      setSelectedAchats([]);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de créer la demande.", variant: "destructive" });
    }
  };

  // -----------------
  // Fetch demandes
  // -----------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rhRes, stockRes] = await Promise.all([rhApi.getDemandes(), stockApi.getDemandesAchat()]);

      const rhDemandes: Demande[] = (rhRes.results || rhRes).map((d: any) => ({
        id: d.id,
        source: "RH",
        description: d.description,
        montant: d.montant || d.achats?.reduce((sum: number, a: Achat) => sum + (a.montant * a.nombre), 0) || 0,
        status: d.status || "en_attente",
        achats: d.achats || [],
        payements: d.payements || [],
      }));

      const stockDemandes: Demande[] = (stockRes.results || stockRes).map((d: any) => ({
        id: d.id,
        source: "Stock",
        description: d.article?.nom || d.description || "-",
        montant: d.montant_estime || d.montant || 0,
        status: d.statut || "en_attente",
        achats: d.achats || [{
          id: d.id,
          article: d.article?.nom || "-",
          montant: d.montant_estime || 0,
          nombre: d.quantite || 1,
          statut: d.statut || "en_attente"
        }],
        payements: d.payements || [],
      }));

      setDemandes([...rhDemandes, ...stockDemandes]);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------
  // Fetch achats disponibles
  // -----------------
  const fetchAchats = async () => {
    try {
      const stockRes = await stockApi.getArticlesDisponibles();
      const rhRes = await rhApi.getArticlesDisponibles();

      const achats: Achat[] = [
        ...stockRes.map((a: any) => ({
          id: a.id,
          article: a.nom,
          montant: a.montant_estime || a.montant || 0,
          nombre: 1,
          statut: "en_attente"
        })),
        ...rhRes.map((a: any) => ({
          id: a.id,
          article: a.nom,
          montant: a.montant || 0,
          nombre: 1,
          statut: "en_attente"
        }))
      ];

      setAvailableAchats(achats);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger les articles.", variant: "destructive" });
    }
  };

  useEffect(() => { fetchData(); fetchAchats(); }, []);

  if (isLoading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements</h1>

      <Button onClick={() => setOpenNewDemande(true)}>Nouvelle demande</Button>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.length ? demandes.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.description}</TableCell>
                  <TableCell>{d.source}</TableCell>
                  <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
                  <TableCell><span className={badgeColor(d.status)}>{d.status}</span></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setDetailsDemande(d)}>Voir</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Aucune demande disponible.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* -------------------- */}
      {/* Modal détails de la demande */}
      {/* -------------------- */}
      <Dialog open={!!detailsDemande} onOpenChange={() => setDetailsDemande(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Détails de la demande</DialogTitle></DialogHeader>
          {detailsDemande && (
            <div className="space-y-4">
              <p><strong>Description:</strong> {detailsDemande.description}</p>
              <p><strong>Source:</strong> {detailsDemande.source}</p>
              <p><strong>Montant:</strong> {detailsDemande.montant.toLocaleString()} Ar</p>
              <p><strong>Status:</strong> <span className={badgeColor(detailsDemande.status)}>{detailsDemande.status}</span></p>

              {detailsDemande.achats.length > 0 && (
                <div>
                  <strong>Achats :</strong>
                  <ul className="ml-4 list-disc">
                    {detailsDemande.achats.map(a => (
                      <li key={a.id}>
                        {a.article} - {a.nombre} x {a.montant.toLocaleString()} Ar
                        {" "} <span className={badgeColor(a.statut)}>{a.statut}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailsDemande.payements.length > 0 && (
                <div>
                  <strong>Payements :</strong>
                  <ul className="ml-4 list-disc">
                    {detailsDemande.payements.map(p => (
                      <li key={p.id}>
                        {p.montant.toLocaleString()} Ar
                        {" "} <span className={badgeColor(p.status)}>{p.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailsDemande.depenses && detailsDemande.depenses.length > 0 && (
                <div>
                  <strong>Dépenses :</strong>
                  <ul className="ml-4 list-disc">
                    {detailsDemande.depenses.map((dep, idx) => (
                      <li key={idx}>{dep.description} - {dep.montant.toLocaleString()} Ar</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDemande(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------- */}
      {/* Modal création nouvelle demande */}
      {/* -------------------- */}
      <Dialog open={openNewDemande} onOpenChange={() => setOpenNewDemande(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Nouvelle demande de décaissement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Source du service</label>
              <select
                value={newDemande.source_service}
                onChange={e => setNewDemande(prev => ({ ...prev, source_service: e.target.value as "RH" | "Stock" }))}
                className="w-full border p-2 rounded"
              >
                <option value="RH">RH</option>
                <option value="Stock">Stock</option>
              </select>
            </div>

            {/* ----------------- */}
            {/* Section Achats */}
            {/* ----------------- */}
            <div>
              <strong>Objets à inclure :</strong>
              {availableAchats.map(a => (
                <div key={a.id} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedAchats.some(sa => sa.id === a.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedAchats(prev => [...prev, a]);
                      else setSelectedAchats(prev => prev.filter(sa => sa.id !== a.id));
                    }}
                  />
                  <span>{a.article} - {a.montant.toLocaleString()} Ar</span>
                  {selectedAchats.some(sa => sa.id === a.id) && (
                    <Input
                      type="number"
                      min={1}
                      value={selectedAchats.find(sa => sa.id === a.id)?.nombre || 1}
                      onChange={e => {
                        const nombre = Number(e.target.value);
                        setSelectedAchats(prev => prev.map(sa => sa.id === a.id ? { ...sa, nombre } : sa));
                      }}
                      className="w-20"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* ----------------- */}
            {/* Section Dépenses */}
            {/* ----------------- */}
            <div>
              <strong>Dépenses libres :</strong>
              {newDemande.depenses.map((dep, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Description"
                    value={dep.description}
                    onChange={e => handleDepenseChange(idx, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Montant"
                    value={dep.montant}
                    onChange={e => handleDepenseChange(idx, "montant", e.target.value)}
                  />
                  <Button variant="destructive" onClick={() => removeDepense(idx)}>Supprimer</Button>
                </div>
              ))}
              <Button size="sm" onClick={addDepense}>Ajouter une dépense</Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateDemande}>Créer</Button>
            <Button variant="outline" onClick={() => setOpenNewDemande(false)}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
