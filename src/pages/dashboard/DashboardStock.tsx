import { useEffect, useState } from "react";
import { stockApi } from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import { ShoppingCart, AlertCircle, Package } from "lucide-react";

export default function DashboardStock() {
  const [stats, setStats] = useState({
    articles: 0,
    demandes: 0,
    ruptures: 0,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const articles = await stockApi.getArticles();
    const demandes = await stockApi.getDemandesAchat();

    setStats({
      articles: articles.results.length,
      demandes: demandes.results.length,
      ruptures: articles.results.filter(a => a.quantite <= a.seuil).length,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Stock</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard icon={Package} label="Articles" value={stats.articles} />
        <KPICard icon={ShoppingCart} label="Demandes d'achat" value={stats.demandes} />
        <KPICard icon={AlertCircle} label="Ruptures" value={stats.ruptures} />
      </div>
    </div>
  );
}
