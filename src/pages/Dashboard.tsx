// src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { rhApi } from "@/lib/api"; // Adapter selon ton API
import { Card } from "@/components/ui/card";
import { Decimal } from "decimal.js";

// -------------------- Typage des données --------------------
interface Employee {
  id: string;
  nom_employer: string;
  prenom_employer: string;
  gender?: string; // si tu veux utiliser le genre pour stats
  date_naissance?: string;
}

interface Contrat {
  id: string;
  employer: Employee;
  salaire?: number;
  date_debut_contrat: string;
  date_fin_contrat?: string;
}

interface Conge {
  id: string;
  employer: Employee;
  status_conge: string;
}

interface Location {
  id: string;
  montant?: number;
}

interface Electricite {
  id: string;
  montant?: number;
}

interface Payement {
  id: string;
  montant?: number;
  status: string;
}

interface Achat {
  id: string;
  montant_total: number;
  statut: string;
}

interface Demande {
  id: string;
  achats: Achat[];
  payements: Payement[];
}

// -------------------- Calcul âge --------------------
const calculateAverageAge = (employees: Employee[]) => {
  const today = new Date();
  const ages = employees
    .map((e) => {
      if (!e.date_naissance) return null;
      const birth = new Date(e.date_naissance);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    })
    .filter((age) => age !== null) as number[];

  if (ages.length === 0) return 0;
  return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
};

// -------------------- Dashboard Component --------------------
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    employees: 0,
    femalePercentage: 0,
    malePercentage: 0,
    avgAge: 0,
    affectations: 0,
    conges: 0,
    pendingConges: 0,
    contrats: 0,
    locations: 0,
    payments: 0,
    achats: 0,
    demandes: 0,
    districts: 0,
    communes: 0,
    fokontany: 0,
    topSalaries: [],
    bottomSalaries: [],
  });

  // -------------------- Charger les données --------------------
  const loadDashboard = async () => {
    try {
      const [
        employeesRes,
        affectationsRes,
        congesRes,
        contratsRes,
        locationsRes,
        paymentsRes,
        achatsRes,
        demandesRes,
        districtsRes,
        communesRes,
        fokosRes,
      ] = await Promise.all([
        rhApi.getEmployes(),
        rhApi.getAffectations(),
        rhApi.getConges(),
        rhApi.getContrats(),
        rhApi.getLocations(),
        rhApi.getPayements(),
        rhApi.getAchats(),
        rhApi.getDemandes(),
        rhApi.getDistricts(),
        rhApi.getCommunes(),
        rhApi.getFokontanys(),
      ]);

      const employees = employeesRes.results || employeesRes;
      const affectations = affectationsRes.results || affectationsRes;
      const conges = congesRes.results || congesRes;
      const contrats = contratsRes.results || contratsRes;
      const locations = locationsRes.results || locationsRes;
      const payments = paymentsRes.results || paymentsRes;
      const achats = achatsRes.results || achatsRes;
      const demandes = demandesRes.results || demandesRes;
      const districts = districtsRes.results || districtsRes;
      const communes = communesRes.results || communesRes;
      const fokos = fokosRes.results || fokosRes;

      const femmesCount = employees.filter((e: Employee) => e.gender === 'F').length;
      const hommesCount = employees.filter((e: Employee) => e.gender === 'M').length;
      const totalEmp = employees.length || 1;

      // Top / Bottom salaires
      const sortedBySalary = [...contrats].sort((a: Contrat, b: Contrat) => (b.salaire || 0) - (a.salaire || 0));
      const topSalaries = sortedBySalary.slice(0, 5);
      const bottomSalaries = sortedBySalary.slice(-5).reverse();

      setStats({
        employees: employees.length,
        femalePercentage: Math.round((femmesCount / totalEmp) * 100),
        malePercentage: Math.round((hommesCount / totalEmp) * 100),
        avgAge: calculateAverageAge(employees),
        affectations: affectations.length,
        conges: conges.length,
        pendingConges: conges.filter((c: Conge) => c.status_conge === 'en_attente').length,
        contrats: contrats.length,
        locations: locations.length,
        payments: payments.length,
        achats: achats.length,
        demandes: demandes.length,
        districts: districts.length,
        communes: communes.length,
        fokontany: fokos.length,
        topSalaries,
        bottomSalaries,
      });
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <p>Chargement du tableau de bord...</p>;

  // -------------------- Affichage --------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <h3>Employés</h3>
        <p>Total: {stats.employees}</p>
        <p>Femmes: {stats.femalePercentage}%</p>
        <p>Hommes: {stats.malePercentage}%</p>
        <p>Âge moyen: {stats.avgAge} ans</p>
      </Card>

      <Card className="p-4">
        <h3>Contrats</h3>
        <p>Total: {stats.contrats}</p>
      </Card>

      <Card className="p-4">
        <h3>Congés</h3>
        <p>Total: {stats.conges}</p>
        <p>En attente: {stats.pendingConges}</p>
      </Card>

      <Card className="p-4">
        <h3>Locations</h3>
        <p>Total: {stats.locations}</p>
      </Card>

      <Card className="p-4">
        <h3>Achats</h3>
        <p>Total: {stats.achats}</p>
      </Card>

      <Card className="p-4">
        <h3>Demandes</h3>
        <p>Total: {stats.demandes}</p>
      </Card>

      <Card className="p-4">
        <h3>Top 5 Salaires</h3>
        <ul>
          {stats.topSalaries.map((c: Contrat) => (
            <li key={c.id}>{c.employer.nom_employer} {c.employer.prenom_employer}: {c.salaire}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3>Bottom 5 Salaires</h3>
        <ul>
          {stats.bottomSalaries.map((c: Contrat) => (
            <li key={c.id}>{c.employer.nom_employer} {c.employer.prenom_employer}: {c.salaire}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
