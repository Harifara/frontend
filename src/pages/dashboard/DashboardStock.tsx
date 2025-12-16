import { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import {
  ShoppingCart,
  AlertCircle,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

interface DashboardStats {
  total_articles: number;
  articles_rupture: number;
  demandes_reappro_en_attente: number;
  transferts_en_attente: number;
  demandes_achat_en_attente: number;
  total_entrees: number;
  total_sorties: number;
}

export default function DashboardStock() {
  const [stats, setStats] = useState<DashboardStats>({
    total_articles: 0,
    articles_rupture: 0,
    demandes_reappro_en_attente: 0,
    transferts_en_attente: 0,
    demandes_achat_en_attente: 0,
    total_entrees: 0,
    total_sorties: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await stockApi.getDashboardStock();
      const kpi = response.kpi;

      setStats({
        total_articles: kpi.total_articles,
        articles_rupture: kpi.articles_rupture,
        demandes_reappro_en_attente: kpi.demandes_reappro_en_attente,
        transferts_en_attente: kpi.transferts_en_attente,
        demandes_achat_en_attente: kpi.demandes_achat_en_attente,
        total_entrees: kpi.total_entrees,
        total_sorties: kpi.total_sorties,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard stock:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Dashboard Stock</h1>
      <p className="text-gray-500 mb-6">Vue d’ensemble des indicateurs clés</p>

      {/* Section Stock */}
      <h2 className="text-xl font-semibold mb-4">📦 Stock</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard icon={Package} label="Articles" value={stats.total_articles} color="blue" />
        <KPICard icon={AlertCircle} label="Ruptures" value={stats.articles_rupture} color="red" />
      </div>

      {/* Section Flux */}
      <h2 className="text-xl font-semibold mb-4">🔄 Flux</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard icon={ArrowUpCircle} label="Entrées" value={stats.total_entrees} color="green" />
        <KPICard icon={ArrowDownCircle} label="Sorties" value={stats.total_sorties} color="purple" />
      </div>

      {/* Section Demandes */}
      <h2 className="text-xl font-semibold mb-4">🛒 Demandes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard icon={ShoppingCart} label="Demandes d'achat" value={stats.demandes_achat_en_attente} color="yellow" />
        <KPICard icon={ShoppingCart} label="Réappro en attente" value={stats.demandes_reappro_en_attente} color="orange" />
        <KPICard icon={Package} label="Transferts en attente" value={stats.transferts_en_attente} color="teal" />
      </div>
    </div>
  );
}
