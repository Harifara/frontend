// src/pages/finance/DecaissementsPage.tsx
import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// -------------------------
// Interfaces
// -------------------------
interface Demande {
  id: string;
  source: "RH" | "Stock";
  description: string;
  montant: number;
  status: string;
  achats?: { id: string; article: string; montant: number; nombre: number; statut: string }[];
  payements?: { id: string; montant: number; status: string }[];
}

// Badge couleur
const badgeColor = (statut: string) => {
  switch (statut.toLowerCase()) {
    case "valide":
      return "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold";
    case "rejete":
      return "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold";
    case "en attente":
    case "en_attente":
      return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold";
  }
};

const DecaissementsPage: React.FC<{ userId: string }> = ({ userId }) => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemandes, setSelectedDemandes] = useState<string[]>([]);
  const [detailsDemande, setDetailsDemande] = useState<Demande | null>(null);
  const { toast } = useToast();

  // -------------------------
  // Fetch Décaissements & Demandes
  // -------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rhRes, stockRes] = await Promise.all([rhApi.getDemandes(), stockApi.getDemandes()]);

      // Normalisation RH
      const rh: Demande[] = (rhRes.results || rhRes).map((d: any) => ({
        id: d.id,
        source: "RH",
        description: d.description,
        montant: d.montant || 0,
        status: d.status || "en_attente",
        achats: d.achats || [],
        payements: d.payements || [],
      }));

      // Normalisation Stock
      const stock: Demande[] = (stockRes.results || stockRes).map((d: any) => ({
        id: d.id,
        source: "Stock",
        description: d.article?.nom || d.description || "-",
        montant: d.montant_estime || d.montant || 0,
        status: d.statut || "en_attente",
        achats: d.achats || [],
        payements: d.payements || [],
      }));

      setDemandes([...rh, ...stock]);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de charger les demandes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -------------------------
  // Sélection et total
  // -------------------------
  const toggleDemandeSelection = (id: string) => {
    setSelectedDemandes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalSelected = selectedDemandes.reduce((acc, id) => {
    const d = demandes.find(x => x.id === id);
    return acc + (d?.montant || 0);
  }, 0);

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Décaissements</h1>

      <h2 className="text-xl font-semibold mt-6">Toutes les demandes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sélection</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.length ? demandes.map(d => (
            <TableRow key={d.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedDemandes.includes(d.id)}
                  onChange={() => toggleDemandeSelection(d.id)}
                />
              </TableCell>
              <TableCell>{d.source}</TableCell>
              <TableCell>{d.description}</TableCell>
              <TableCell>{d.montant.toLocaleString()} Ar</TableCell>
              <TableCell><span className={badgeColor(d.status)}>{d.status}</span></TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => setDetailsDemande(d)}>
                  Voir
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">Aucune demande disponible.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <p className="mt-2 font-medium">Total sélectionné: {totalSelected.toLocaleString()} Ar</p>

      {/* ------------------------- */}
      {/* Modal détails de la demande */}
      {/* ------------------------- */}
      <Dialog open={!!detailsDemande} onOpenChange={() => setDetailsDemande(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>

          {detailsDemande && (
            <div className="space-y-4">
              <p><strong>Description:</strong> {detailsDemande.description}</p>
              <p><strong>Source:</strong> {detailsDemande.source}</p>
              <p><strong>Montant:</strong> {detailsDemande.montant.toLocaleString()} Ar</p>
              <p><strong>Status:</strong> <span className={badgeColor(detailsDemande.status)}>{detailsDemande.status}</span></p>

              {detailsDemande.achats && detailsDemande.achats.length > 0 && (
                <div>
                  <strong>Achats:</strong>
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

              {detailsDemande.payements && detailsDemande.payements.length > 0 && (
                <div>
                  <strong>Payements:</strong>
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
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsDemande(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecaissementsPage;
