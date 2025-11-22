import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layout principal
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages principales
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

// Pages RH
import Districts from "./pages/rh/Districts";
import Communes from "./pages/rh/Communes";
import Fokontanys from "./pages/rh/Fokontanys";
import Fonctions from "./pages/rh/Fonctions";
import Employes from "./pages/rh/Employes";
import EmployeProfile from "./pages/rh/EmployeProfile";
import Affectations from "./pages/rh/Affectations"; 
import AffectationProfile from "./pages/rh/AffectationProfile"// ✅ ajout de la nouvelle page
import TypeConge from "./pages/rh/TypeConge";
import Conges from "./pages/rh/Conges";
import TypeContratsPage from "./pages/rh/TypeContratsPage";  
import ContratsPage from "./pages/rh/ContratsPage";
import Locations from "./pages/rh/Locations";
import Electricites from "./pages/rh/Electricites";
import ModePayement from "./pages/rh/ModePayement";
import Categories from "./pages/stock/Categories";
import Articles from "./pages/stock/Articles";
import Magasins from "./pages/stock/Magasins";
import StockManagement from "./pages/stock/StockManagement";
import MouvementStockManagement from "./pages/stock/MouvementStockManagement";

const queryClient = new QueryClient();

// ✅ Protection des routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Routes protégées */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Utilisateurs & Logs */}
              <Route path="/users" element={<Users />} />
              <Route path="/audit-logs" element={<AuditLogs />} />

              {/* Pages RH */}
              <Route path="/rh/districts" element={<Districts />} />
              <Route path="/rh/communes" element={<Communes />} />
              <Route path="/rh/fokontanys" element={<Fokontanys />} />
              <Route path="/rh/fonctions" element={<Fonctions />} />
              <Route path="/rh/employes" element={<Employes />} />
              <Route path="/rh/employes/:id" element={<EmployeProfile />} />
              <Route path="/rh/affectations" element={<Affectations />} /> {/* ✅ nouvelle page */}
              <Route path="/rh/affectations/:id" element={<AffectationProfile />} /> {/* ✅ nouvelle page */}
              <Route path="/rh/type-conges" element={<TypeConge />} />
              <Route path="/rh/conges" element={<Conges />} />
              <Route path="/rh/categories" element={<Categories />} />
              <Route path="/rh/type-contrats" element={<TypeContratsPage />} />
              <Route path="/rh/contrats" element={<ContratsPage />} />
              <Route path="/rh/locations" element={<Locations />} />
              <Route path="/rh/electricites" element={<Electricites />} />
              <Route path="/rh/mode-payement" element={<ModePayement />} />

              {/* Pages Stock */}
              <Route path="/stock/magasins" element={<Magasins />} />
              <Route path="/stock/articles" element={<Articles />} />
              <Route path="/stock/gestion-stock" element={<StockManagement />} />
              <Route path="/stock/mouvement-stock" element={<MouvementStockManagement />} />
              </Route>
              

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
