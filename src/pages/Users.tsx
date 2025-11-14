// src/pages/user/UserManagement.tsx
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { authApi, stockApi } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.jpg";
import { FileDown, Users } from "lucide-react";

// ---------------------------
// Roles dynamiques
// ---------------------------
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "responsable_rh", label: "Responsable RH" },
  { value: "responsable_stock", label: "Responsable Stock" },
  { value: "responsable_finance", label: "Responsable Finance" },
  { value: "magasinier", label: "Magasinier" },
  { value: "coordinateur", label: "Coordinateur" },
];

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  magasin_id?: string;
  store?: { id: string; name: string };
}

interface Store {
  id: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<any>({
    username: "",
    email: "",
    full_name: "",
    role: "",
    is_active: true,
    magasin_id: "",
    password: "",
    password_confirm: "",
  });

  // ---------------------------
  // Fetch Users & Stores
  // ---------------------------
  const fetchData = async () => {
    try {
      const [usersRes, storesRes] = await Promise.all([
        authApi.getUsers(),
        stockApi.getMagasins()
      ]);

      const normalizedStores = storesRes.map((m: any) => ({
        id: m.id || m.pk,
        name: m.nom || m.name || "-",
      }));
      setStores(normalizedStores);

      const normalizedUsers = usersRes.map((u: any) => ({
        ...u,
        store: u.magasin_id
          ? normalizedStores.find((s) => s.id === u.magasin_id)
          : undefined,
      }));

      setUsers(normalizedUsers);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger les utilisateurs ou magasins.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------------------
  // Open Modal
  // ---------------------------
  const openModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        magasin_id: user.store?.id || "",
        password: "",
        password_confirm: "",
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: "",
        email: "",
        full_name: "",
        role: "",
        is_active: true,
        magasin_id: "",
        password: "",
        password_confirm: "",
      });
    }
    setModalOpen(true);
  };

  // ---------------------------
  // Save User
  // ---------------------------
  const handleSave = async () => {
    try {
      if (formData.role === "magasinier" && !formData.magasin_id) {
        toast({
          title: "Erreur",
          description: "Veuillez choisir un magasin.",
          variant: "destructive",
        });
        return;
      }

      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
        delete payload.password_confirm;
      }
      if (payload.role !== "magasinier") delete payload.magasin_id;

      if (selectedUser) {
        await authApi.updateUser(selectedUser.id, payload);
        toast({ title: "Succès", description: "Utilisateur modifié avec succès." });
      } else {
        await authApi.register(payload);
        toast({ title: "Succès", description: "Nouvel utilisateur ajouté." });
      }

      fetchData();
      setModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------
  // Delete User
  // ---------------------------
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await authApi.deleteUser(selectedUser.id);
      toast({ title: "Succès", description: "Utilisateur supprimé avec succès." });
      fetchData();
      setDeleteModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de la suppression.",
        variant: "destructive",
      });
    }
  };

  // ---------------------------
  // Export PDF
  // ---------------------------
  const exportPDF = async () => {
    const doc = new jsPDF("p", "pt");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const toBase64 = (url: string) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Erreur de chargement du logo");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = reject;
        img.src = url;
      });

    const logoBase64 = await toBase64(logo);

    const addHeader = () => {
      doc.addImage(logoBase64, "JPEG", 40, 30, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("LISTE DES UTILISATEURS", pageWidth / 2, 50, { align: "center" });
      doc.setLineWidth(0.3);
      doc.line(40, 80, pageWidth - 40, 80);
    };

    addHeader();

    autoTable(doc, {
      startY: 100,
      head: [["Nom d'utilisateur", "Nom complet", "Email", "Rôle", "Magasin", "Statut"]],
      body: users.map((u) => [
        u.username,
        u.full_name,
        u.email,
        ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role,
        u.store?.name || "-",
        u.is_active ? "Actif" : "Inactif",
      ]),
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth - 80, pageHeight - 20);
      },
    });

    doc.save("utilisateurs.pdf");
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6" /> Gestion des utilisateurs
        </h2>
        <div className="space-x-2">
          <Button onClick={() => openModal()}>Ajouter un utilisateur</Button>
          <Button variant="outline" onClick={exportPDF} className="flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Exporter PDF
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom d'utilisateur</TableHead>
            <TableHead>Nom complet</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Magasin</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}</TableCell>
              <TableCell>{user.store?.name || "-"}</TableCell>
              <TableCell>{user.is_active ? "Actif" : "Inactif"}</TableCell>
              <TableCell className="text-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => openModal(user)}>Modifier</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setSelectedUser(user); setDeleteModalOpen(true); }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom d'utilisateur</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label>Nom complet</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Rôle</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Magasin uniquement pour magasinier */}
            {formData.role === "magasinier" && (
              <div>
                <Label>Magasin</Label>
                <Select value={formData.magasin_id} onValueChange={(value) => setFormData({ ...formData, magasin_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={selectedUser ? "Laisser vide pour ne pas changer" : ""}
              />
            </div>
            <div>
              <Label>Confirmer le mot de passe</Label>
              <Input
                type="password"
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Voulez-vous vraiment supprimer l'utilisateur "{selectedUser?.username}" ?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
