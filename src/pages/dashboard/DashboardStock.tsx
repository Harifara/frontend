import { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { ShoppingCart, AlertCircle, Package } from "lucide-react";

export default function DashboardStock() {
  const [stats, setStats] = useState({
    totalArticles: 0,
    demandesAchat: 0,
    ruptures: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await stockApi.getDashboardStock(); // Appelle l'API /dashboard_stock
      setStats({
        totalArticles: res.kpi.total_articles,
        demandesAchat: res.kpi.demandes_achat_en_attente,
        ruptures: res.kpi.articles_rupture,
      });
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger le dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Stock</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard icon={Package} label="Articles" value={stats.totalArticles} />
        <KPICard icon={ShoppingCart} label="Demandes d'achat" value={stats.demandesAchat} />
        <KPICard icon={AlertCircle} label="Ruptures" value={stats.ruptures} />
      </div>
    </div>
  );
}
