// src/lib/dashboardApi.ts
import { API_BASE_URL, getHeaders, getKongToken, authApi, cleanUUID, fetchWithLog } from "./api";

// Assure que le token Kong est présent
const ensureKongToken = async (): Promise<string> => {
  let token = getKongToken();
  if (!token) token = await authApi.fetchKongToken();
  if (!token) throw new Error("Impossible de récupérer le token Kong");
  return token;
};

// ==========================================
// 🔹 DASHBOARD API
// ==========================================
export const dashboardApi = {
  // ===== RH =====
  getRH: async () => {
    const token = await ensureKongToken();
    return fetchWithLog(`${API_BASE_URL}/rh/dashboard-rh/`, { headers: getHeaders(token) });
  },

  // ===== STOCK =====
  getStock: async () => {
    const token = await ensureKongToken();
    return fetchWithLog(`${API_BASE_URL}/stock/dashboard-stock/`, { headers: getHeaders(token) });
  },

  // ===== FINANCE =====
  getFinance: async () => {
    const token = await ensureKongToken();
    const data: any[] = await fetchWithLog(`${API_BASE_URL}/finance/decaissements/`, { headers: getHeaders(token) });
    // Filtrer uniquement les demandes en attente
    return data.filter(d => d.statut !== "decaisse");
  },
};
