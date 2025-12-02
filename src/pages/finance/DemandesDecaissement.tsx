import React, { useState } from "react";
import { financeApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface DemandeForm {
  objet: string;
  justificatif: string;
  montant: number;
  validations: string[]; // liste des UUID des personnes à valider
}

const VALIDATEURS = [
  { id: "coordo_finance", label: "Coordonnateur Finance" },
  { id: "coordo_programme", label: "Coordonnateur Programme" },
  { id: "dg", label: "Directeur Général" },
  { id: "daf", label: "DAF" },
];

export default function DemandeDecaissementForm() {
  const [form, setForm] = useState<DemandeForm>({
    objet: "",
    justificatif: "",
    montant: 0,
    validations: [],
  });

  const [isSending, setIsSending] = useState(false);
  const [isSelectionDisabled, setIsSelectionDisabled] = useState(false);

  // Gestion des champs simples
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Gestion des validations multi-sélection
  const toggleValidation = (id: string) => {
    if (isSelectionDisabled) return;

    setForm((prev) => {
      const exists = prev.validations.includes(id);
      return {
        ...prev,
        validations: exists
          ? prev.validations.filter((v) => v !== id)
          : [...prev.validations, id],
      };
    });
  };

  // Envoi
  const handleSubmit = async () => {
    try {
      if (!form.objet || !form.justificatif || !form.montant) {
        toast.error("Veuillez remplir tous les champs.");
        return;
      }

      if (form.validations.length === 0) {
        toast.error("Veuillez sélectionner au moins un validateur.");
        return;
      }

      setIsSending(true);

      await financeApi.post("/demandes-decaissement/", form);

      toast.success("Demande envoyée avec succès !");
      setIsSelectionDisabled(true); // ❌ désactiver la sélection une fois envoyé
    } catch (error) {
      toast.error("Erreur lors de l’envoi de la demande.");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Créer une Demande de Décaissement</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>Objet</Label>
          <Input
            name="objet"
            value={form.objet}
            onChange={handleChange}
            placeholder="Ex: Achat matériel informatique"
          />
        </div>

        <div>
          <Label>Justificatif</Label>
          <Textarea
            name="justificatif"
            value={form.justificatif}
            onChange={handleChange}
            placeholder="Explique pourquoi le décaissement est nécessaire"
          />
        </div>

        <div>
          <Label>Montant</Label>
          <Input
            name="montant"
            type="number"
            value={form.montant}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label>Choisir les validateurs</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {VALIDATEURS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`border p-2 rounded ${
                  form.validations.includes(v.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100"
                } ${
                  isSelectionDisabled
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                }`}
                onClick={() => toggleValidation(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isSending}>
          {isSending ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </CardContent>
    </Card>
  );
}
