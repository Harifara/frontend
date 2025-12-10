import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/financeApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { createPDFDoc } from "@/lib/pdfTemplate";

type ItemStatut = "en_attente" | "valide" | "rejete";

interface Item {
  id: string;
  description: string;
  montant: string | number;
  statut: ItemStatut;
}

const STATUT_LABELS: Record<ItemStatut, string> = {
  en_attente: "En attente",
  valide: "Validé",
  rejete: "Rejeté",
};

const DemandesDecaissement: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getItems();
      // Support pagination { results: [...] } or array [...]
      const rawList = Array.isArray(data) ? data : data?.results ?? [];
      const normalized: Item[] = rawList.map((it: any) => ({
        id: String(it.id),
        description: it.description ?? "",
        montant: it.montant ?? 0,
        statut: it.statut as ItemStatut,
      }));
      setItems(normalized);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible de charger les items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditModal = (item: Item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const handleUpdateStatut = async (statut: ItemStatut) => {
    if (!editing) return;
    try {
      // financeApi expose updateItemStatut and updateItem (alias) — try both if necessary
      if (financeApi.updateItemStatut) {
        await financeApi.updateItemStatut(editing.id, { statut });
      } else if ((financeApi as any).updateItem) {
        await (financeApi as any).updateItem(editing.id, statut);
      } else {
        throw new Error("Méthode d'API introuvable pour mettre à jour l'item.");
      }
      toast({ title: "Succès", description: `Statut mis à jour : ${STATUT_LABELS[statut]}` });
      await fetchData();
      setIsModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const filteredItems = items.filter((i) =>
    `${i.description} ${STATUT_LABELS[i.statut]}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMontant = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return "-";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
  };

  const exportPDF = async () => {
    const data = filteredItems.map((i) => [i.description, String(i.montant), STATUT_LABELS[i.statut]]);
    const columns = ["Description", "Montant", "Statut"];
    await createPDFDoc("Demandes de Décaissement", data, columns, "demandes_decaissement.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((i) => ({
        Description: i.description,
        Montant: typeof i.montant === "string" ? i.montant : i.montant.toString(),
        Statut: STATUT_LABELS[i.statut],
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DemandesDecaissement");
    XLSX.writeFile(workbook, "demandes_decaissement.xlsx");
  };

  if (loading) return <p className="p-8 text-center">Chargement...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandes de Décaissement</h1>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">
          Exporter PDF
        </Button>
        <Button onClick={exportExcel} variant="outline">
          Exporter Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length ? (
                filteredItems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-center">{i.description}</TableCell>
                    <TableCell className="text-center">{formatMontant(i.montant)}</TableCell>
                    <TableCell className="text-center">{STATUT_LABELS[i.statut]}</TableCell>
                    <TableCell className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(i)}>
                        Modifier Statut
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    Aucun item trouvé.
                  </TableCell>
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
            <Button onClick={() => handleUpdateStatut("valide")}>Validé</Button>
            <Button onClick={() => handleUpdateStatut("rejete")} variant="destructive">
              Rejeté
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setEditing(null);
              }}
              variant="outline"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesDecaissement;