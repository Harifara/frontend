// src/pages/stock/MagasinManagement.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { stockApi, rhApi } from "@/lib/api";
import { MapPin } from "lucide-react";


interface Magasin {
  id: string;
  nom: string;
  adresse: string;
  district_id: string;
  district_name?: string;
  capacite_max?: number | null;
  is_active: boolean;
}

interface District {
  id: string;
  name: string; // Correspond à l'API RH
}

const MagasinManagement: React.FC = () => {
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMagasin, setSelectedMagasin] = useState<Magasin | null>(null);

  const [formData, setFormData] = useState<any>({
    nom: "",
    adresse: "",
    district_id: "",
    capacite_max: "",
    is_active: true,
  });

  // Charger les districts
  const fetchDistricts = async () => {
    try {
      const data = await rhApi.getDistricts();
      setDistricts(data);
      return data;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les districts.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Charger les magasins et enrichir avec le nom du district
  const fetchMagasins = async (districtList: District[]) => {
    try {
      const data = await stockApi.getMagasins();
      const enriched = data.map((m: Magasin) => ({
        ...m,
        district_name:
          districtList.find((d) => d.id.toString() === m.district_id.toString())?.name ||
          "Nom manquant",
      }));
      setMagasins(enriched);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les magasins.",
        variant: "destructive",
      });
    }
  };

  // Charger tout au démarrage
  useEffect(() => {
    const loadData = async () => {
      const districtList = await fetchDistricts();
      await fetchMagasins(districtList);
    };
    loadData();
  }, []);

  // Ouvrir modal ajout / modification
  const openModal = (magasin?: Magasin) => {
    if (magasin) {
      setSelectedMagasin(magasin);
      setFormData({
        nom: magasin.nom,
        adresse: magasin.adresse,
        district_id: magasin.district_id?.toString() || "",
        capacite_max: magasin.capacite_max ?? "",
        is_active: magasin.is_active,
      });
    } else {
      setSelectedMagasin(null);
      setFormData({
        nom: "",
        adresse: "",
        district_id: "",
        capacite_max: "",
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  // Sauvegarder magasin
  const handleSave = async () => {
    if (!formData.nom || !formData.adresse || !formData.district_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      nom: formData.nom,
      adresse: formData.adresse,
      district_id: formData.district_id,
      capacite_max: formData.capacite_max ? Number(formData.capacite_max) : null,
      is_active: formData.is_active,
    };

    try {
      if (selectedMagasin) {
        await stockApi.updateMagasin(selectedMagasin.id, payload);
        toast({ title: "Succès", description: "Magasin modifié avec succès." });
      } else {
        await stockApi.createMagasin(payload);
        toast({ title: "Succès", description: "Nouveau magasin ajouté." });
      }
      fetchMagasins(districts);
      setModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  // Supprimer magasin
  const handleDelete = async () => {
    if (!selectedMagasin) return;
    try {
      await stockApi.deleteMagasin(selectedMagasin.id);
      toast({ title: "Succès", description: "Magasin supprimé avec succès." });
      fetchMagasins(districts);
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de la suppression.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Gestion des magasins
        </h2>
        <Button onClick={() => openModal()}>Ajouter un magasin</Button>
      </div>

      {/* Tableau */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Capacité max</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {magasins.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.nom}</TableCell>
              <TableCell>{m.adresse}</TableCell>
              <TableCell>{m.district_name}</TableCell>
              <TableCell>{m.capacite_max ?? "-"}</TableCell>
              <TableCell>{m.is_active ? "Actif" : "Inactif"}</TableCell>
              <TableCell className="text-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => openModal(m)}>Modifier</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setSelectedMagasin(m); setDeleteModalOpen(true); }}
                >
                  Supprimer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal Ajout / Modification */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedMagasin ? "Modifier le magasin" : "Ajouter un magasin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom</Label>
              <Input value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} />
            </div>
            <div>
              <Label>District</Label>
              <select
                value={formData.district_id}
                onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="">Sélectionner un district</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.name || "Nom manquant"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Capacité maximale</Label>
              <Input
                type="number"
                value={formData.capacite_max}
                onChange={(e) => setFormData({ ...formData, capacite_max: e.target.value })}
              />
            </div>
            <div>
              <Label>Statut</Label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full border rounded p-2"
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {selectedMagasin ? "Enregistrer les modifications" : "Créer le magasin"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Voulez-vous vraiment supprimer ce magasin ?</p>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MagasinManagement;
