import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { rhApi } from "@/lib/api";

export default function CreateAchatPage() {
  const { toast } = useToast();

  const [demandeId, setDemandeId] = useState<string | null>(null);
  const [typeAchatId, setTypeAchatId] = useState<string | null>(null);
  const [article, setArticle] = useState("");
  const [codeAchat, setCodeAchat] = useState("");
  const [nombre, setNombre] = useState(1);
  const [montant, setMontant] = useState(0);

  const [demandes, setDemandes] = useState<any[]>([]);
  const [typesAchat, setTypesAchat] = useState<any[]>([]);

  // Load demandes & types d'achat
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const d = await rhApi.getDemandes();
    const t = await rhApi.getTypesAchat();
    setDemandes(d?.data || []);
    setTypesAchat(t?.data || []);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!article || !codeAchat || !typeAchatId) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
      return;
    }

    const payload = {
      demande: demandeId || null,
      article,
      code_achat: codeAchat,
      nombre,
      montant,
      type_achat: typeAchatId,
    };

    try {
      await rhApi.createAchat(payload);
      toast({ title: "Succès", description: "Achat créé avec succès !" });

      // Reset form
      setArticle("");
      setCodeAchat("");
      setNombre(1);
      setMontant(0);
      setDemandeId(null);
      setTypeAchatId(null);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d’enregistrer l’achat." });
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl p-6 shadow">
      <h2 className="text-xl font-bold mb-4">Créer un Achat</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* DEMANDE */}
        <div>
          <Label>Demande (optionnel)</Label>
          <Select onValueChange={setDemandeId} value={demandeId || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une demande" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Aucune</SelectItem>
              {demandes.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.reference} — {d.demandeur_nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TYPE ACHAT */}
        <div>
          <Label>Type d'Achat</Label>
          <Select onValueChange={setTypeAchatId} value={typeAchatId || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type d'achat" />
            </SelectTrigger>
            <SelectContent>
              {typesAchat.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ARTICLE */}
        <div>
          <Label>Article</Label>
          <Input
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="Ex : Chaise ergonomique"
          />
        </div>

        {/* CODE ACHAT */}
        <div>
          <Label>Code Achat</Label>
          <Input
            value={codeAchat}
            onChange={(e) => setCodeAchat(e.target.value)}
            placeholder="Ex : ACH-2025-001"
          />
        </div>

        {/* NOMBRE */}
        <div>
          <Label>Quantité</Label>
          <Input
            type="number"
            value={nombre}
            onChange={(e) => setNombre(Number(e.target.value))}
          />
        </div>

        {/* MONTANT */}
        <div>
          <Label>Montant (Ar)</Label>
          <Input
            type="number"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
          />
        </div>

        <Button type="submit" className="w-full">Créer</Button>
      </form>
    </div>
  );
}
