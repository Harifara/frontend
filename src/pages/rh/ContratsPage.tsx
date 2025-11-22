import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

export default function ContratsPage() {
  const { toast } = useToast();

  const [contrats, setContrats] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [typesContrat, setTypesContrat] = useState([]);
  const [editing, setEditing] = useState(null);
  const [file, setFile] = useState(null);

  // ----------- FETCH INITIAL DATA ------------
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [c, e, t] = await Promise.all([
        api.get("/rh/contrats/"),
        api.get("/rh/employers/"),
        api.get("/rh/types-contrat/"),
      ]);
      setContrats(c.data);
      setEmployes(e.data);
      setTypesContrat(t.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
    }
  };

  // ----------- OUVERTURE FORMULAIRE ------------
  const openAdd = () => {
    setEditing({
      employer: null,
      type_contrat: null,
      nature_contrat: "emploi",
      status_contrat: "actif",
      date_debut_contrat: "",
      date_fin_contrat: "",
      salaire: "",
      montant_total: "",
      description_mission: "",
    });
    setFile(null);
  };

  const openEdit = (contrat) => {
    setEditing(contrat);
    setFile(null);
  };

  const closeForm = () => setEditing(null);

  // ----------- PAYLOAD CORRIGÉ BACKEND 100% ----------
  const buildPayload = () => {
    if (!editing) return {};

    let payload: any = {
      employer_id: editing.employer?.id,
      type_contrat_id: editing.type_contrat?.id || null,
      nature_contrat: editing.nature_contrat,
      status_contrat: editing.status_contrat,
      date_debut_contrat: editing.date_debut_contrat,
      date_fin_contrat: editing.date_fin_contrat || null,
    };

    // ----------- CONTRAT EMPLOI ------------
    if (editing.nature_contrat === "emploi") {
      payload.salaire = Number(editing.salaire ?? 0);
      payload.montant_total = null;
      payload.description_mission = null;
    }

    // ----------- CONTRAT MISSION OU PRESTATION ------------
    if (editing.nature_contrat === "mission" || editing.nature_contrat === "prestation") {
      payload.salaire = null;
      payload.montant_total = Number(editing.montant_total ?? 0);
      payload.description_mission = editing.description_mission || null;
    }

    return payload;
  };

  // ----------- ENREGISTRER CONTRAT ----------
  const saveContrat = async () => {
    try {
      let payload = buildPayload();

      let method = editing.id ? "patch" : "post";
      let url = editing.id ? `/rh/contrats/${editing.id}/` : `/rh/contrats/`;

      let formData;

      // ----------- GESTION DU FICHIER -------------
      if (file) {
        formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });

        formData.append("contrat_file", file);

        await api[method](url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api[method](url, payload);
      }

      toast({ title: "Succès", description: "Contrat enregistré avec succès" });
      closeForm();
      fetchData();
    } catch (err) {
      console.error("ERREUR API:", err.response?.data || err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le contrat",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-5">
      <div className="flex justify-between mb-5">
        <h2 className="text-xl font-bold">Gestion des contrats</h2>
        <Button onClick={openAdd}>Ajouter</Button>
      </div>

      {/* TABLEAU */}
      <div className="grid gap-3">
        {contrats.map((c) => (
          <div key={c.id} className="border p-3 rounded">
            <div className="font-semibold">{c.employer.nom} – {c.nature_contrat.toUpperCase()}</div>
            <div>Début : {c.date_debut_contrat}</div>
            <div>Status : {c.status_contrat}</div>
            <Button className="mt-2" onClick={() => openEdit(c)}>Modifier</Button>
          </div>
        ))}
      </div>

      {/* FORMULAIRE */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 w-[500px] rounded shadow space-y-4">

            <h3 className="font-bold text-lg">
              {editing.id ? "Modifier un contrat" : "Créer un contrat"}
            </h3>

            {/* EMPLOYÉ */}
            <Select
              value={editing.employer?.id || ""}
              onValueChange={(v) => {
                const emp = employes.find((x) => x.id === v);
                setEditing((e) => ({ ...e, employer: emp }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Sélectionner employé" /></SelectTrigger>
              <SelectContent>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* TYPE CONTRAT */}
            <Select
              value={editing.type_contrat?.id || ""}
              onValueChange={(v) => {
                const t = typesContrat.find((x) => x.id === v);
                setEditing((e) => ({ ...e, type_contrat: t }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Type de contrat" /></SelectTrigger>
              <SelectContent>
                {typesContrat.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nom_type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* NATURE */}
            <Select
              value={editing.nature_contrat}
              onValueChange={(v) => setEditing((e) => ({ ...e, nature_contrat: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emploi">Contrat de travail</SelectItem>
                <SelectItem value="prestation">Contrat de prestation</SelectItem>
                <SelectItem value="mission">Contrat de mission</SelectItem>
              </SelectContent>
            </Select>

            {/* DATES */}
            <Input
              type="date"
              value={editing.date_debut_contrat}
              onChange={(e) => setEditing((x) => ({ ...x, date_debut_contrat: e.target.value }))}
            />

            <Input
              type="date"
              value={editing.date_fin_contrat || ""}
              onChange={(e) => setEditing((x) => ({ ...x, date_fin_contrat: e.target.value }))}
            />

            {/* SALAIRE / MONTANT SELON NATURE */}
            {editing.nature_contrat === "emploi" && (
              <Input
                type="number"
                placeholder="Salaire"
                value={editing.salaire}
                onChange={(e) => setEditing((x) => ({ ...x, salaire: e.target.value }))}
              />
            )}

            {(editing.nature_contrat === "prestation" ||
              editing.nature_contrat === "mission") && (
                <>
                  <Input
                    type="number"
                    placeholder="Montant total"
                    value={editing.montant_total}
                    onChange={(e) =>
                      setEditing((x) => ({ ...x, montant_total: e.target.value }))
                    }
                  />

                  <Textarea
                    placeholder="Description mission"
                    value={editing.description_mission || ""}
                    onChange={(e) =>
                      setEditing((x) => ({ ...x, description_mission: e.target.value }))
                    }
                  />
                </>
              )}

            {/* FILE */}
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeForm}>Annuler</Button>
              <Button onClick={saveContrat}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
