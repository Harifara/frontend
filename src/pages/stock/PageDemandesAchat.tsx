import React, { useEffect, useState } from "react";
import { stockApi } from "@/lib/api"; // ton fichier d'API

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  magasin_id?: string; // si le backend renvoie l'ID du magasin
}

interface Stock {
  id: string;
  article: {
    nom: string;
  };
  quantite: number;
  seuil_alerte: number;
  magasin: {
    id: string;
    nom: string;
  };
}

const StocksPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Récupérer l'utilisateur connecté
        const user = await stockApi.me();
        setCurrentUser(user);

        // 2️⃣ Récupérer tous les stocks
        const allStocks = await stockApi.getStocks();

        // 3️⃣ Filtrer selon le rôle
        const filteredStocks =
          user.role === "magasinier" && user.magasin_id
            ? allStocks.filter(
                (s: Stock) => s.magasin.id === user.magasin_id
              )
            : allStocks;

        setStocks(filteredStocks);
      } catch (err) {
        console.error("Erreur récupération stocks :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (stocks.length === 0) return <p>Aucun stock trouvé.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Article</th>
          <th>Magasin</th>
          <th>Quantité</th>
          <th>Seuil Alerte</th>
        </tr>
      </thead>
      <tbody>
        {stocks.map((stock) => (
          <tr key={stock.id}>
            <td>{stock.article.nom}</td>
            <td>{stock.magasin.nom}</td>
            <td>{stock.quantite}</td>
            <td>{stock.seuil_alerte}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StocksPage;
