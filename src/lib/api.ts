// ------------------------
// Configuration API
// ------------------------
// ------------------------
// Configuration API
// ------------------------
export const API_BASE_URL =
  window.__CONFIG__?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "https://api.ecartmada.com";

export const MEDIA_URL =
  window.__CONFIG__?.MEDIA_URL || import.meta.env.VITE_MEDIA_URL || "https://api.ecartmada.com/media/";


const DRF_TOKEN_KEY = "drf_token";
const KONG_TOKEN_KEY = "kong_token";

export const cleanUUID = (id: string) => id.replace(/\s/g, "").trim();

export const getDrfToken = () => localStorage.getItem(DRF_TOKEN_KEY);
export const setDrfToken = (token: string) => localStorage.setItem(DRF_TOKEN_KEY, token);
export const clearDrfToken = () => localStorage.removeItem(DRF_TOKEN_KEY);

export const getKongToken = () => localStorage.getItem(KONG_TOKEN_KEY);
export const setKongToken = (token: string) => localStorage.setItem(KONG_TOKEN_KEY, token);
export const clearKongToken = () => localStorage.removeItem(KONG_TOKEN_KEY);

// ------------------------
// Headers
// ------------------------
export const getHeaders = (token?: string | null, json = true) => {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// ------------------------
// Fetch avec log
// ------------------------
export const fetchWithLog = async (url: string, options: RequestInit = {}) => {
  console.log("➡️ REQUEST:", url, options);
  const res = await fetch(url, options);
  let data: any = {};
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { text } : {};
    }
  } catch {
    data = {};
  }
  console.log("⬅️ RESPONSE:", res.status, data);
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Erreur HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
};

// ------------------------
// AUTH API (DRF Token)
// ------------------------
export const authApi = {
  login: async (username: string, password: string) => {
    const data = await fetchWithLog(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (data.access) setDrfToken(data.access);
    if (data.access) {
      const kongData = await authApi.fetchKongToken();
      if (kongData) setKongToken(kongData);
    }
    return data;
  },

  logout: async () => {
    const token = getDrfToken();
    await fetchWithLog(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: getHeaders(token),
    });
    clearDrfToken();
    clearKongToken();
  },

  getMe: async () => fetchWithLog(`${API_BASE_URL}/auth/me/`, { headers: getHeaders(getDrfToken()) }),
  getUsers: async () => fetchWithLog(`${API_BASE_URL}/auth/users/`, { headers: getHeaders(getDrfToken()) }),
  register: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/auth/register/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }),

  createUserWithAdminToken: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/auth/users/`, { method: "POST", headers: getHeaders(getDrfToken()), body: JSON.stringify(payload) }),

  updateUser: async (userId: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/auth/users/${cleanUUID(userId)}/`, { method: "PATCH", headers: getHeaders(getDrfToken()), body: JSON.stringify(payload) }),

  deleteUser: async (userId: string) =>
    fetchWithLog(`${API_BASE_URL}/auth/users/${cleanUUID(userId)}/`, { method: "DELETE", headers: getHeaders(getDrfToken()) }),

  getAuditLogs: async () => fetchWithLog(`${API_BASE_URL}/auth/logs/`, { headers: getHeaders(getDrfToken()) }),

  fetchKongToken: async () => {
    const token = getDrfToken();
    if (!token) throw new Error("Aucun token DRF trouvé");
    const data = await fetchWithLog(`${API_BASE_URL}/auth/kong-token/`, { headers: getHeaders(token) });
    if (data.kong_token) setKongToken(data.kong_token);
    return data.kong_token;
  },
};

// ------------------------
// Helper pour récupérer le token Kong
// ------------------------
const ensureKongToken = async (): Promise<string> => {
  let token = getKongToken();
  if (!token) token = await authApi.fetchKongToken();
  if (!token) throw new Error("Impossible de récupérer le token Kong");
  return token;
};

// ------------------------
// RH API (Kong JWT Token)
// ------------------------
export const rhApi = {
  // === DISTRICTS ===
  getDistricts: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/districts/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createDistrict: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/districts/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateDistrict: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/districts/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteDistrict: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/districts/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

  // === COMMUNES ===
  getCommunes: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/communes/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createCommune: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/communes/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateCommune: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/communes/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteCommune: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/communes/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

  // === FOKONTANY ===
  getFokontanys: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/fokontanys/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createFokontany: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/fokontanys/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateFokontany: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/fokontanys/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteFokontany: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/fokontanys/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

    // === FONCTIONS ===
  getFonctions: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/fonctions/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createFonction: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/fonctions/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateFonction: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/fonctions/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteFonction: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/fonctions/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

  
  // === EMPLOYÉS ===
  getEmployes: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/employers/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createEmploye: async (payload: FormData) =>
    fetchWithLog(`${API_BASE_URL}/rh/employers/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await ensureKongToken()}` }, // ✅ pas de Content-Type
      body: payload,
    }),

  updateEmploye: async (id: string, payload: FormData) =>
    fetchWithLog(`${API_BASE_URL}/rh/employers/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${await ensureKongToken()}` }, // ✅ pas de Content-Type
      body: payload,
    }),

  deleteEmploye: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/employers/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),


  // === AFFECTATIONS ===
  getAffectations: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/affectations/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createAffectation: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/affectations/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateAffectation: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/affectations/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteAffectation: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/affectations/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

  // === CONTRATS ===

  getTypeContrats: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/type-contrats/`, { headers: getHeaders(await ensureKongToken()) }),
  
  createTypeContrat: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-contrats/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateTypeContrat: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-contrats/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteTypeContrat: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-contrats/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),
  getContrats: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/contrats/`, {
      headers: getHeaders(await ensureKongToken()),
    }),

  createContrat: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/contrats/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  updateContrat: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/contrats/${cleanUUID(id)}/`, {
      method: "PATCH",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify(payload),
    }),

  deleteContrat: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/contrats/${cleanUUID(id)}/`, {
      method: "DELETE",
      headers: getHeaders(await ensureKongToken()),
    }),

  getConges: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/conges/`, { headers: getHeaders(await ensureKongToken()) }),
  createConge: async (formData: FormData) =>
    fetchWithLog(`${API_BASE_URL}/rh/conges/`, { method: "POST", headers: { Authorization: `Bearer ${await ensureKongToken()}` }, body: formData }),
  approveConge: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/conges/${cleanUUID(id)}/approve/`, { method: "POST", headers: getHeaders(await ensureKongToken()) }),
  rejectConge: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/conges/${cleanUUID(id)}/reject/`, { method: "POST", headers: getHeaders(await ensureKongToken()) }),
  updateConge: async (id: string, formData: FormData) =>
  fetchWithLog(`${API_BASE_URL}/rh/conges/${cleanUUID(id)}/`, {
    method: "PATCH", // ou PUT selon ce que ton backend attend
    headers: { Authorization: `Bearer ${await ensureKongToken()}` }, // pas de Content-Type pour FormData
    body: formData,
  }),

  // === TYPE DE CONGÉ ===
  getTypeConges: async () =>
    fetchWithLog(`${API_BASE_URL}/rh/type-conges/`, { headers: getHeaders(await ensureKongToken()) }),
  createTypeConge: async (payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-conges/`, { method: "POST", headers: getHeaders(await ensureKongToken()), body: JSON.stringify(payload) }),
  updateTypeConge: async (id: string, payload: any) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-conges/${cleanUUID(id)}/`, { method: "PATCH", headers: getHeaders(await ensureKongToken()), body: JSON.stringify(payload) }),
  deleteTypeConge: async (id: string) =>
    fetchWithLog(`${API_BASE_URL}/rh/type-conges/${cleanUUID(id)}/`, { method: "DELETE", headers: getHeaders(await ensureKongToken()) }),


};

// ------------------------
// STOCK API (Kong JWT Token)
// ------------------------
export const stockApi = {

  // ====================
  // CATEGORIES
  // ====================
  getCategories: async () => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/categories/`, { headers: getHeaders(token) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur lors de la récupération des catégories");
    }
    return res.json();
  },

  getCategorie: async (id: string) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/categories/${cleanUUID(id)}/`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error("Erreur lors de la récupération de la catégorie");
    return res.json();
  },

  createCategorie: async (payload: any) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/categories/`, { method: "POST", headers: getHeaders(token), body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur lors de la création de la catégorie");
    }
    return res.json();
  },

  updateCategorie: async (id: string, payload: any) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/categories/${cleanUUID(id)}/`, { method: "PATCH", headers: getHeaders(token), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour de la catégorie");
    return res.json();
  },

  deleteCategorie: async (id: string) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/categories/${cleanUUID(id)}/`, { method: "DELETE", headers: getHeaders(token) });
    if (!res.ok) throw new Error("Erreur lors de la suppression de la catégorie");
    return res;
  },

  // ====================
  // MAGASINS
  // ====================
  getMagasins: async () => fetchWithLog(`${API_BASE_URL}/stock/magasins/`, { headers: getHeaders(await ensureKongToken()) }),
  getMagasin: async (id: string) => fetchWithLog(`${API_BASE_URL}/stock/magasins/${cleanUUID(id)}/`, { headers: getHeaders(await ensureKongToken()) }),
  createMagasin: async (payload: any) => fetchWithLog(`${API_BASE_URL}/stock/magasins/`, { method: "POST", headers: getHeaders(await ensureKongToken()), body: JSON.stringify(payload) }),
  updateMagasin: async (id: string, payload: any) => fetchWithLog(`${API_BASE_URL}/stock/magasins/${cleanUUID(id)}/`, { method: "PATCH", headers: getHeaders(await ensureKongToken()), body: JSON.stringify(payload) }),
  deleteMagasin: async (id: string) => fetchWithLog(`${API_BASE_URL}/stock/magasins/${cleanUUID(id)}/`, { method: "DELETE", headers: getHeaders(await ensureKongToken()) }),

  // ====================
  // ARTICLES
  // ====================
  getArticles: async () => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/articles/`, { headers: getHeaders(token) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur lors de la récupération des articles");
    }
    return res.json();
  },

  getArticle: async (id: string) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/articles/${cleanUUID(id)}/`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error("Erreur lors de la récupération de l'article");
    return res.json();
  },

  createArticle: async (payload: any) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/articles/`, { method: "POST", headers: getHeaders(token), body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur lors de la création de l'article");
    }
    return res.json();
  },

  updateArticle: async (id: string, payload: any) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/articles/${cleanUUID(id)}/`, { method: "PATCH", headers: getHeaders(token), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour de l'article");
    return res.json();
  },

  deleteArticle: async (id: string) => {
    const token = await ensureKongToken();
    const res = await fetch(`${API_BASE_URL}/stock/articles/${cleanUUID(id)}/`, { method: "DELETE", headers: getHeaders(token) });
    if (!res.ok) throw new Error("Erreur lors de la suppression de l'article");
    return res;
  },

  getStocks: async () => {
  const token = await ensureKongToken();
  const res = await fetch(`${API_BASE_URL}/stock/stocks/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur lors de la récupération des stocks");
  }
  return res.json();
},

getStock: async (id: string) => {
  const token = await ensureKongToken();
  const res = await fetch(`${API_BASE_URL}/stock/stocks/${cleanUUID(id)}/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération du stock");
  return res.json();
},

createStock: async (payload: any) => {
  const token = await ensureKongToken();
  const res = await fetch(`${API_BASE_URL}/stock/stocks/`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur lors de la création du stock");
  }
  return res.json();
},

updateStock: async (id: string, payload: any) => {
  const token = await ensureKongToken();
  const res = await fetch(`${API_BASE_URL}/stock/stocks/${cleanUUID(id)}/`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du stock");
  return res.json();
},

deleteStock: async (id: string) => {
  const token = await ensureKongToken();
  const res = await fetch(`${API_BASE_URL}/stock/stocks/${cleanUUID(id)}/`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du stock");
  return res;
},

ajouterStock: async (id: string, qte: number) =>
    fetchWithLog(`${API_BASE_URL}/stock/stocks/${cleanUUID(id)}/ajouter/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify({ quantite: qte }),
    }),

  retirerStock: async (id: string, qte: number) =>
    fetchWithLog(`${API_BASE_URL}/stock/stocks/${cleanUUID(id)}/retirer/`, {
      method: "POST",
      headers: getHeaders(await ensureKongToken()),
      body: JSON.stringify({ quantite: qte }),
    }),

  getMouvements: async () =>
  fetchWithLog(`${API_BASE_URL}/stock/mouvements-stock/`, {
    headers: getHeaders(await ensureKongToken()),
  }),

getMouvement: async (id: string) =>
  fetchWithLog(`${API_BASE_URL}/stock/mouvements-stock/${cleanUUID(id)}/`, {
    headers: getHeaders(await ensureKongToken()),
  }),

createMouvement: async (payload: any) =>
  fetchWithLog(`${API_BASE_URL}/stock/mouvements-stock/`, {
    method: "POST",
    headers: getHeaders(await ensureKongToken()),
    body: JSON.stringify(payload),
  }),

updateMouvement: async (id: string, payload: any) =>
  fetchWithLog(`${API_BASE_URL}/stock/mouvements-stock/${cleanUUID(id)}/`, {
    method: "PATCH",
    headers: getHeaders(await ensureKongToken()),
    body: JSON.stringify(payload),
  }),

deleteMouvement: async (id: string) =>
  fetchWithLog(`${API_BASE_URL}/stock/mouvements-stock/${cleanUUID(id)}/`, {
    method: "DELETE",
    headers: getHeaders(await ensureKongToken()),
  }),

};

