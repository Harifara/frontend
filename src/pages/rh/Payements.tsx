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

interface Payement {
  id?: string;
  montant?: number;
  date_payement?: string;
  status?: string;
  reference?: string;
  mode_payement?: { mode_payement: string };
}

const PayementsPage = () => {
  const [payements, setPayements] = useState<Payement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await rhApi.getPayements();
      setPayements(data || []);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de charger les paiements.", variant: "destructive" });
      setPayements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedIdToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      await rhApi.deletePayement(selectedIdToDelete);
      toast({ title: "Succès", description: "Paiement supprimé." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression.", variant: "destructive" });
    } finally {
      setSelectedIdToDelete(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await rhApi.completePayement(id);
      toast({ title: "Succès", description: "Paiement marqué comme complété." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la mise à jour.", variant: "destructive" });
    }
  };

  const filteredPayements = payements.filter(p =>
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mode_payement?.mode_payement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Export PDF
  const exportPDF = async () => {
    const data = filteredPayements.map(p => [
      p.reference,
      p.montant,
      p.status,
      p.mode_payement?.mode_payement || ""
    ]);
    const columns = ["Référence", "Montant", "Status", "Mode de Paiement"];
    await createPDFDoc("Liste des Paiements", data, columns, "payements.pdf");
  };

  // --- Export Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayements.map(p => ({
        Référence: p.reference,
        Montant: p.montant,
        Status: p.status,
        "Mode de Paiement": p.mode_payement?.mode_payement || ""
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
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Rechercher par référence ou mode de paiement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={exportPDF} variant="outline">Exporter PDF</Button>
        <Button onClick={exportExcel} variant="outline">Exporter Excel</Button>
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
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Mode de Paiement</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayements.length ? filteredPayements.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">{p.reference}</TableCell>
                  <TableCell className="text-center">{p.montant}</TableCell>
                  <TableCell className="text-center">{p.status}</TableCell>
                  <TableCell className="text-center">{p.mode_payement?.mode_payement}</TableCell>
                  <TableCell className="text-center space-x-2">
                    {p.status !== "complete" && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(p.id!)}>Compléter</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(p.id!)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">Aucun paiement trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayementsPage;
