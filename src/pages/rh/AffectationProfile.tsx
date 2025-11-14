// src/pages/AffectationProfile.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rhApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Affectation {
  id: string;
  employer?: {
    id: string;
    nom_employer: string;
    prenom_employer: string;
    image?: string;
    fonction?: { id: string; nom_fonction: string };
    district?: { id: string; name: string };
  };
  ancienne_fonction?: { id: string; nom_fonction: string };
  ancien_district?: { id: string; name: string };
  nouveau_fonction?: { id: string; nom_fonction: string };
  nouveau_district?: { id: string; name: string };
  type_affectation?: "permanente" | "temporaire" | "mission";
  status_affectation?: "active" | "inactive" | "suspendue" | "terminee";
  date_creation_affectation?: string;
  date_fin?: string;
  remarque?: string;
}

const AffectationProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [affectation, setAffectation] = useState<Affectation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAffectation = async () => {
    try {
      const data = await rhApi.getAffectations();
      const found = data.find((a: Affectation) => a.id === id);
      setAffectation(found || null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur de récupération.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffectation();
  }, [id]);

  if (loading) return <p className="p-8 text-center">Chargement...</p>;
  if (!affectation) return <p className="p-8 text-center text-red-500">Affectation introuvable</p>;

  const ancienFonction = affectation.ancienne_fonction?.nom_fonction || affectation.employer?.fonction?.nom_fonction || "-";
  const ancienDistrict = affectation.ancien_district?.name || affectation.employer?.district?.name || "-";

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Bouton retour */}
      <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft size={16} /> Retour
      </Button>

      {/* Carte principale */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col gap-4">
          <CardTitle>Détails de l'affectation</CardTitle>
          <Badge
            variant={
              affectation.status_affectation === "active"
                ? "default"
                : affectation.status_affectation === "inactive"
                ? "secondary"
                : "destructive"
            }
          >
            {affectation.status_affectation}
          </Badge>
        </CardHeader>

        <Separator />

        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">👤 Employé</h2>
            {affectation.employer?.image && (
              <img
                src={affectation.employer.image}
                alt={`${affectation.employer.nom_employer} ${affectation.employer.prenom_employer}`}
                className="w-24 h-24 rounded-full mb-2 object-cover"
              />
            )}
            <ul className="space-y-2 text-sm">
              <li><strong>Nom :</strong> {affectation.employer ? `${affectation.employer.nom_employer} ${affectation.employer.prenom_employer}` : "-"}</li>
              <li><strong>Fonction actuelle :</strong> {affectation.employer?.fonction?.nom_fonction || "-"}</li>
              <li><strong>District actuel :</strong> {affectation.employer?.district?.name || "-"}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-4 mb-2">🏢 Ancienne affectation</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Fonction :</strong> {ancienFonction}</li>
              <li><strong>District :</strong> {ancienDistrict}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">🏢 Nouvelle affectation</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Fonction :</strong> {affectation.nouveau_fonction?.nom_fonction || "-"}</li>
              <li><strong>District :</strong> {affectation.nouveau_district?.name || "-"}</li>
              <li><strong>Type :</strong> {affectation.type_affectation || "-"}</li>
              <li><strong>Date de création :</strong> {affectation.date_creation_affectation || "-"}</li>
              <li><strong>Date de fin :</strong> {affectation.date_fin || "-"}</li>
              <li><strong>Motife :</strong> {affectation.remarque || "-"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffectationProfile;
