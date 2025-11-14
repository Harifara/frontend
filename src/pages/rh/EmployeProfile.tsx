import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rhApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employer {
  id: string;
  nom_employer: string;
  prenom_employer: string;
  email: string;
  telephone?: string;
  adresse?: string;
  status_employer: string;
  date_entree: string;
  date_naissance?: string;
  diplome?: string;
  domaine_etude?: string;
  fonction?: { id: string; nom_fonction: string };
  district?: { id: string; name: string };
  photo_profil?: string;
  cv?: string;
  created_at: string;
  updated_at: string;
}

const EmployeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employe, setEmploye] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);

  // URL de base pour les médias
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9000/media/";

  const fetchEmploye = async () => {
    try {
      // Remplacer par un endpoint getEmploye(id) si disponible
      const data = await rhApi.getEmployes();
      const found = data.find((e: Employer) => e.id === id);
      setEmploye(found || null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmploye();
  }, [id]);

  if (loading) return <p className="p-8 text-center">Chargement...</p>;
  if (!employe) return <p className="p-8 text-center text-red-500">Employé introuvable</p>;

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Bouton retour */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Retour
      </Button>

      {/* Carte principale */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row gap-6 items-center">
          {/* Photo de profil */}
          <div className="relative w-32 h-32">
            {employe.photo_profil ? (
              <img
                src={
                  employe.photo_profil.startsWith("http")
                    ? employe.photo_profil
                    : `${API_URL}${employe.photo_profil}`
                }
                alt="Profil"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                Aucun
              </div>
            )}
          </div>

          {/* Infos de base */}
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">
              {employe.nom_employer} {employe.prenom_employer}
            </h1>
            <p className="text-gray-600">{employe.fonction?.nom_fonction || "Aucune fonction"}</p>
            <Badge
              variant={
                employe.status_employer === "actif"
                  ? "default"
                  : employe.status_employer === "conge"
                  ? "secondary"
                  : "destructive"
              }
            >
              {employe.status_employer}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* Informations personnelles */}
          <div>
            <h2 className="text-lg font-semibold mb-2">📄 Informations personnelles</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Date de naissance :</strong> {employe.date_naissance || "Non renseignée"}</li>
              <li><strong>Email :</strong> {employe.email}</li>
              <li><strong>Téléphone :</strong> {employe.telephone || "-"}</li>
              <li><strong>Adresse :</strong> {employe.adresse || "-"}</li>
              <li><strong>Date d’entrée :</strong> {employe.date_entree}</li>
              <li><strong>ID :</strong> {employe.id}</li>
              <li><strong>Créé le :</strong> {new Date(employe.created_at).toLocaleDateString()}</li>
            </ul>
          </div>

          {/* Formation & Affectation */}
          <div>
            <h2 className="text-lg font-semibold mb-2">🎓 Formation</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Diplôme :</strong> {employe.diplome || "-"}</li>
              <li><strong>Domaine d’étude :</strong> {employe.domaine_etude || "-"}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-4 mb-2">🏢 Affectation</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Fonction :</strong> {employe.fonction?.nom_fonction || "-"}</li>
              <li><strong>District :</strong> {employe.district?.name || "-"}</li>
            </ul>
          </div>
        </CardContent>

        <Separator />

        {/* CV et dernière mise à jour */}
        <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4">
          {employe.cv ? (
            <Button asChild variant="outline">
              <a
                href={employe.cv.startsWith("http") ? employe.cv : `${API_URL}${employe.cv}`}
                download={`${employe.nom_employer}_${employe.prenom_employer}_CV.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Download size={16} /> Télécharger le CV
              </a>
            </Button>
          ) : (
            <span className="text-gray-500 text-sm">Aucun CV disponible</span>
          )}

          <p className="text-xs text-gray-400">
            Dernière mise à jour : {new Date(employe.updated_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeProfile;
