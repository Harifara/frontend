import React, { useEffect, useState } from "react";
import { financeApi, rhApi, stockApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

type Source = "finance" | "rh" | "stock";

interface Item {
  id: string;
  description: string;
  montant: number;
  statut: string; // normalized statut/status string
  source: Source;
  raw?: any; // original raw object when useful
}

const normalizeRh = (d: any): Item => ({
  id: d.id,
  description: d.description || d.title || "Demande RH",
  montant: Number(d.montant || d.montant_total || d.montant || 0),
  statut: (d.status || d.statut || "en_attente").toString(),
  source: "rh",
  raw: d,
});

const normalizeFinance = (f: any): Item => ({
  id: f.id,
  description: f.description || f.nom || "Demande Finance",
  montant: Number(f.montant || 0),
  statut: (f.statut || f.status || "en_attente").toString(),
  source: "finance",
  raw: f,
});

const normalizeStock = (s: any): Item => ({
  id: s.id,
  description:
    s.numero ||
    s.justification ||
    (s.article ? `${s.article.nom || s.article}` : "Demande Achat"),
  montant: Number(s.montant_estime || s.montant || 0),
  statut: (s.statut || s.statut_finance || "en_attente").toString(),
  source: "stock",
  raw: s,
});

const extractList = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.results && Array.isArray(response.results)) return response.results;
  return [];
};

const DemandesDecaissement = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer depuis les 3 sources et normaliser en une seule liste
      const [financeRes, rhRes, stockRes] = await Promise.all([
        financeApi.getItems().catch((e: any) => {
          console.warn("financeApi.getItems failed", e);
          return [];
        }),
        rhApi.getDemandes().catch((e: any) => {
          console.warn("rhApi.getDemandes failed", e);
          return [];
        }),
        stockApi.getDemandesAchat().catch((e: any) => {
          console.warn("stockApi.getDemandesAchat failed", e);
          return [];
        }),
      ]);

      const finList = extractList(financeRes).map(normalizeFinance);
      const rhList = extractList(rhRes).map(normalizeRh);
      const stockList = extractList(stockRes).map(normalizeStock);

      // Fusionner et trier par montant décroissant (ou par id/date selon besoin)
      const merged = [...finList, ...rhList, ...stockList].sort((a, b) => b.montant - a.montant);

      setItems(merged);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les demandes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openEditModal = (item: Item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  // Mettre à jour le statut en appelant l'API correspondante selon la source
  const handleUpdateStatut = async (statut: string) => {
    if (!editing) return;
    try {
      if (editing.source === "finance") {
        // financeApi.updateItem(id, statut) était utilisé auparavant
        await financeApi.updateItem(editing.id, statut);
      } else if (editing.source === "rh") {
        // Pour RH : utiliser les endpoints d'approbation/rejet si statut binaire
        if (statut.toLowerCase().includes("valid")) {
          // approve
          if (typeof rhApi.approveDemande === "function") {
            await rhApi.approveDemande(editing.id);
          } else {
            // fallback : tentative d'update
            await rhApi.updateDemande(editing.id, { status: "approuve" });
          }
        } else if (statut.toLowerCase().includes("rejet")) {
          if (typeof rhApi.rejectDemande === "function") {
            await rhApi.rejectDemande(editing.id);
          } else {
            await rhApi.updateDemande(editing.id, { status: "rejete" });
          }
        } else {
          // en_attente ou autre
          await rhApi.updateDemande?.(editing.id, { status: statut }).catch(() => {
            // si pas d'update disponible, on ignore
            console.warn("rhApi.updateDemande non disponible ou échoue");
          });
        }
      } else if (editing.source === "stock") {
        // Stock : valider/rejeter via stockApi
        if (statut.toLowerCase().includes("valid")) {
          if (typeof stockApi.validerDemandeAchat === "function") {
            await stockApi.validerDemandeAchat(editing.id);
          } else {
            await stockApi.updateDemandeAchat?.(editing.id, { statut: "valide" });
          }
        } else if (statut.toLowerCase().includes("rejet")) {
          if (typeof stockApi.rejeterDemandeAchat === "function") {
            // certaines implémentations requièrent un commentaire ; ici on envoie sans
            await stockApi.rejeterDemandeAchat(editing.id, "");
          } else {
            await stockApi.updateDemandeAchat?.(editing.id, { statut: "rejete" });
          }
        } else {
          await stockApi.updateDemandeAchat?.(editing.id, { statut }).catch(() => {
            console.warn("stockApi.updateDemandeAchat non disponible ou échoue");
          });
        }
      }

      toast({ title: "Succès", description: `Statut mis à jour à "${statut}"` });
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  };

  const filteredItems = items.filter(i =>
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.statut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    const data = filteredItems.map(i => [i.description, i.montant, i.statut, i.source]);
    const columns = ["Description", "Montant", "Statut", "Source"];
    await createPDFDoc("Demandes de Décaissement (Toutes sources)", data, columns, "demandes_decaissement_toutes_sources.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map(i => ({ Description: i.description, Montant: i.montant, Statut: i.statut, Source: i.source }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DemandesDecaissement");
    XLSX.writeFile(workbook, "demandes_decaissement_toutes_sources.xlsx");
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandes de Décaissement (Toutes sources)</h1>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Rechercher (description / statut / source)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1" />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Source</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length ? filteredItems.map(i => (
                <TableRow key={`${i.source}-${i.id}`}>
                  <TableCell className="text-center">{i.description}</TableCell>
                  <TableCell className="text-center">{i.montant.toLocaleString?.() ?? i.montant}</TableCell>
                  <TableCell className="text-center">{i.statut}</TableCell>
                  <TableCell className="text-center">{i.source}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(i)}>Modifier Statut</Button>
                    {/* Actions rapides — valider/rejeter selon la source */}
                    {i.source === "finance" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatut("validé")}>Valider</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatut("rejeté")}>Rejeter</Button>
                      </>
                    )}
                    {i.source === "rh" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatut("validé")}>Approuver RH</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatut("rejeté")}>Refuser RH</Button>
                      </>
                    )}
                    {i.source === "stock" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatut("validé")}>Valider Achat</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatut("rejeté")}>Rejeter Achat</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun item trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={() => handleUpdateStatut("en_attente")}>En attente</Button>
            <Button onClick={() => handleUpdateStatut("validé")}>Validé</Button>
            <Button onClick={() => handleUpdateStatut("rejeté")} variant="destructive">Rejeté</Button>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;