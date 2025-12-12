import { useEffect, useState } from "react";
import { 
  Users, 
  FileText, 
  Calendar, 
  Building2, 
  ShoppingCart, 
  CreditCard,
  MapPin,
  TrendingUp 
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { DemographicsCard } from "@/components/dashboard/DemographicsCard";
import { SalaryChart } from "@/components/dashboard/SalaryChart";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";

// Mock data pour la démonstration
const mockStats = {
  employees: 156,
  femalePercentage: 42,
  malePercentage: 58,
  avgAge: 34,
  affectations: 89,
  conges: 45,
  pendingConges: 12,
  contrats: 156,
  locations: 23,
  payments: 1247,
  achats: 89,
  demandes: 34,
  districts: 8,
  communes: 42,
  fokontany: 156,
  topSalaries: [
    { id: "1", name: "Rakoto J.", salary: 4500000 },
    { id: "2", name: "Andria M.", salary: 4200000 },
    { id: "3", name: "Rabe S.", salary: 3800000 },
    { id: "4", name: "Rasoa L.", salary: 3500000 },
    { id: "5", name: "Ravelo P.", salary: 3200000 },
  ],
  bottomSalaries: [
    { id: "6", name: "Koto H.", salary: 800000 },
    { id: "7", name: "Niry T.", salary: 850000 },
    { id: "8", name: "Fara B.", salary: 900000 },
    { id: "9", name: "Soa V.", salary: 950000 },
    { id: "10", name: "Lova R.", salary: 1000000 },
  ],
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    // Simuler un chargement API
    const timer = setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />

        {/* Stats principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Employés"
            value={stats.employees}
            subtitle="Actifs ce mois"
            icon={<Users className="h-6 w-6" />}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <StatCard
            title="Contrats"
            value={stats.contrats}
            subtitle="En cours"
            icon={<FileText className="h-6 w-6" />}
            variant="success"
            delay={50}
          />
          <StatCard
            title="Congés en attente"
            value={stats.pendingConges}
            subtitle={`Sur ${stats.conges} demandes`}
            icon={<Calendar className="h-6 w-6" />}
            variant="warning"
            delay={100}
          />
          <StatCard
            title="Affectations"
            value={stats.affectations}
            subtitle="Cette année"
            icon={<Building2 className="h-6 w-6" />}
            variant="info"
            delay={150}
          />
        </div>

        {/* Démographie */}
        <div className="mb-6">
          <DemographicsCard
            totalEmployees={stats.employees}
            femalePercentage={stats.femalePercentage}
            malePercentage={stats.malePercentage}
            averageAge={stats.avgAge}
            delay={200}
          />
        </div>

        {/* Stats secondaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Achats"
            value={stats.achats}
            icon={<ShoppingCart className="h-6 w-6" />}
            delay={250}
          />
          <StatCard
            title="Paiements"
            value={stats.payments}
            icon={<CreditCard className="h-6 w-6" />}
            delay={300}
          />
          <StatCard
            title="Locations"
            value={stats.locations}
            icon={<Building2 className="h-6 w-6" />}
            delay={350}
          />
          <StatCard
            title="Demandes"
            value={stats.demandes}
            icon={<TrendingUp className="h-6 w-6" />}
            delay={400}
          />
        </div>

        {/* Géographie */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Districts"
            value={stats.districts}
            icon={<MapPin className="h-6 w-6" />}
            variant="info"
            delay={450}
          />
          <StatCard
            title="Communes"
            value={stats.communes}
            icon={<MapPin className="h-6 w-6" />}
            variant="success"
            delay={500}
          />
          <StatCard
            title="Fokontany"
            value={stats.fokontany}
            icon={<MapPin className="h-6 w-6" />}
            variant="warning"
            delay={550}yyyy
          />
        </div>

        {/* Graphiques des salaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalaryChart
            title="Top 5 Salaires"
            data={stats.topSalaries}
            type="top"
            delay={600}
          />
          <SalaryChart
            title="5 Plus Bas Salaires"
            data={stats.bottomSalaries}
            type="bottom"
            delay={650}
          />
        </div>
      </div>
    </div>
  );
}
