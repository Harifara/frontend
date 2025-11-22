import React, { useEffect, useState } from "react";
import { rhApi } from "@/api";
import { Dialog } from "@headlessui/react";
import { format } from "date-fns";

interface Employe {
  id: string;
  nom: string;
}

interface TypeContrat {
  id: string;
  nom_type: string;
}

interface Contrat {
  id: string;
  employer: Employe;
  type_contrat: TypeContrat | null;
  nature_contrat: string;
  status_contrat: string;
  date_debut_contrat: string;
  date_fin_contrat?: string;
  duree_jours?: number;
  salaire: number;
  montant_total?: number;
  description_mission?: string;
}

const natureOptions = [
  { value: "emploi", label: "Contrat de travail" },
  { value: "prestation", label: "Contrat de prestation" },
  { value: "mission", label: "Contrat de mission" },
];

const statusOptions = [
  { value: "actif", label: "Actif" },
  { value: "expire", label: "Expiré" },
  { value: "resilie", label: "Résilié" },
  { value: "suspendu", label: "Suspendu" },
  { value: "termine", label: "Terminé" },
];

export const ContratPage: React.FC = () => {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [typeContrats, setTypeContrats] = useState<TypeContrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Contrat>>({});

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [c, e, t] = await Promise.all([rhApi.getContrats(), rhApi.getEmployes(), rhApi.getTypeContrats()]);
      setContrats(c);
      setEmployes(e);
      setTypeContrats(t);
    } catch (err: any) {
      alert(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        employer: formData.employer?.id,
        type_contrat: formData.type_contrat?.id,
      };
      if (formData.id) {
        await rhApi.updateContrat(formData.id, payload);
      } else {
        await rhApi.createContrat(payload);
      }
      setModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la sauvegarde du contrat");
    }
  };

  const handleEdit = (contrat: Contrat) => {
    setFormData(contrat);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce contrat ?")) {
      try {
        await rhApi.deleteContrat(id);
        fetchAll();
      } catch (err: any) {
        alert(err.message || "Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des Contrats</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => {
          setFormData({});
          setModalOpen(true);
        }}
      >
        Ajouter un contrat
      </button>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Employé</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Nature</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Début</th>
              <th className="border p-2">Fin</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contrats.map((c) => (
              <tr key={c.id}>
                <td className="border p-2">{c.employer.nom}</td>
                <td className="border p-2">{c.type_contrat?.nom_type || "N/A"}</td>
                <td className="border p-2">{c.nature_contrat}</td>
                <td className="border p-2">{c.status_contrat}</td>
                <td className="border p-2">{format(new Date(c.date_debut_contrat), "dd/MM/yyyy")}</td>
                <td className="border p-2">{c.date_fin_contrat ? format(new Date(c.date_fin_contrat), "dd/MM/yyyy") : "-"}</td>
                <td className="border p-2 space-x-2">
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(c)}>
                    Éditer
                  </button>
                  <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(c.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <Dialog.Panel className="bg-white p-6 rounded w-full max-w-md">
          <Dialog.Title className="text-xl font-bold mb-4">{formData.id ? "Modifier" : "Ajouter"} un contrat</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label>Employé:</label>
              <select
                name="employer"
                value={formData.employer?.id || ""}
                onChange={(e) => {
                  const selected = employes.find((emp) => emp.id === e.target.value);
                  setFormData((prev) => ({ ...prev, employer: selected }));
                }}
                className="border p-1 w-full"
                required
              >
                <option value="">-- Sélectionner --</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Type de contrat:</label>
              <select
                name="type_contrat"
                value={formData.type_contrat?.id || ""}
                onChange={(e) => {
                  const selected = typeContrats.find((t) => t.id === e.target.value);
                  setFormData((prev) => ({ ...prev, type_contrat: selected }));
                }}
                className="border p-1 w-full"
              >
                <option value="">-- Sélectionner --</option>
                {typeContrats.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom_type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Nature:</label>
              <select name="nature_contrat" value={formData.nature_contrat || ""} onChange={handleInputChange} className="border p-1 w-full">
                {natureOptions.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Statut:</label>
              <select name="status_contrat" value={formData.status_contrat || ""} onChange={handleInputChange} className="border p-1 w-full">
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Date début:</label>
              <input type="date" name="date_debut_contrat" value={formData.date_debut_contrat || ""} onChange={handleInputChange} className="border p-1 w-full" required />
            </div>

            <div>
              <label>Date fin:</label>
              <input type="date" name="date_fin_contrat" value={formData.date_fin_contrat || ""} onChange={handleInputChange} className="border p-1 w-full" />
            </div>

            <div>
              <label>Salaire:</label>
              <input type="number" name="salaire" value={formData.salaire || 0} onChange={handleInputChange} className="border p-1 w-full" />
            </div>

            <div>
              <label>Montant total:</label>
              <input type="number" name="montant_total" value={formData.montant_total || 0} onChange={handleInputChange} className="border p-1 w-full" />
            </div>

            <div>
              <label>Description:</label>
              <textarea name="description_mission" value={formData.description_mission || ""} onChange={handleInputChange} className="border p-1 w-full" />
            </div>

            <div className="flex justify-end space-x-2 mt-2">
              <button type="button" className="px-4 py-2 rounded border" onClick={() => setModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                {formData.id ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};
