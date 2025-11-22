import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileSearch,
  MapPin,
  Building2,
  Warehouse,
  ClipboardList,
  FileText,
  Briefcase,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

// Navigation dynamique selon le rôle
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "responsable_rh", "responsable_stock", "responsable_finance", "magasinier", "coordinateur"] },
  { name: "Utilisateurs", href: "/users", icon: Users, roles: ["admin"] },
  { name: "Logs d'audit", href: "/audit-logs", icon: FileSearch, roles: ["admin"] },
  {
    name: "Localisation",
    icon: MapPin,
    roles: ["admin", "responsable_rh"],
    items: [
      { name: "Districts", href: "/rh/districts", icon: MapPin, roles: ["admin", "responsable_rh"] },
      { name: "Communes", href: "/rh/communes", icon: MapPin, roles: ["admin", "responsable_rh"] },
      { name: "Fokontanys", href: "/rh/fokontanys", icon: MapPin, roles: ["admin", "responsable_rh"] },
    ],
  },
  { name: "Fonctions", href: "/rh/fonctions", icon: FileText, roles: ["admin", "responsable_rh"] },
  { name: "Employés", href: "/rh/employes", icon: Users, roles: ["admin", "responsable_rh"] },
  {
    name: "Contrats",
    icon: FileText,
    roles: ["admin", "responsable_rh"],
    items: [
      { name: "Types de contrats", href: "/rh/type-contrats", icon: FileText, roles: ["admin", "responsable_rh"] },
      { name: "Contrats", href: "/rh/contrats", icon: FileText, roles: ["admin", "responsable_rh"] },
        ],
  },
  
  { name: "Locations", href: "/rh/locations", icon: MapPin, roles: ["admin", "responsable_rh"] },
  { name: "Electricités", href: "/rh/electricites", icon: MapPin, roles: ["admin", "responsable_rh", "responsable_finance"] },
  { name: "Mode de payement", href: "/rh/mode-payement", icon: MapPin, roles: ["admin", "responsable_finance"] },
  { name: "Payements", href: "/rh/payements", icon: MapPin, roles: ["admin", "responsable_finance"] },
  { name: "Affectations", href: "/rh/affectations", icon: Briefcase, roles: ["admin", "responsable_rh"] },
  { name: "Magasins", href: "/stock/magasins", icon: Warehouse, roles: ["admin", "responsable_stock"] },
  { name: "Type de congés", href: "/rh/type-conges", icon: ClipboardList, roles: ["admin", "responsable_rh"] },
  { name: "Congés", href: "/rh/conges", icon: ClipboardList, roles: ["admin", "responsable_rh"] },
  { name: "Catégories", href: "/rh/categories", icon: ClipboardList, roles: ["admin", "responsable_stock"] },
  { name: "Articles", href: "/stock/articles", icon: ClipboardList, roles: ["admin", "responsable_stock", "magasinier"] },
  { name: "Gestion de stock", href: "/stock/gestion-stock", icon: ClipboardList, roles: ["admin", "responsable_stock", "magasinier"] },
  { name: "Mouvements de stock", href: "/stock/mouvement-stock", icon: ClipboardList, roles: ["admin", "responsable_stock", "magasinier"] },
];

// Fonction pour initiales utilisateur
const getInitials = (user: any) => {
  if (user?.full_name) return user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return user?.username?.slice(0, 2).toUpperCase() || "";
};

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const filteredNavigation = navigation.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar shadow-lg z-50 flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center h-28 px-4 bg-sidebar-accent/10">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-md flex items-center justify-center bg-white">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
        </div>
        <span className="mt-2 text-2xl font-extrabold text-sidebar-foreground tracking-wide">E.C.A.R.T</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map(item => {
          // Si item a des sous-items => menu déroulant
          if (item.items) {
            const isOpen = openDropdowns.includes(item.name);
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg border border-transparent text-sidebar-foreground/70 hover:border-green-600 hover:text-sidebar-foreground transition-all duration-200"
                >
                  <item.icon className="w-5 h-5 mr-3 opacity-90" strokeWidth={1.8} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isOpen &&
                  <div className="pl-8 space-y-1">
                    {item.items.filter(sub => sub.roles.includes(user.role)).map(sub => {
                      const isActive = location.pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          to={sub.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ease-in-out",
                            isActive
                              ? "border-green-700 bg-green-50 text-green-800"
                              : "border-transparent text-sidebar-foreground/70 hover:border-green-600 hover:text-sidebar-foreground"
                          )}
                        >
                          <sub.icon className="w-5 h-5 mr-3 opacity-90" strokeWidth={1.8} />
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                }
              </div>
            );
          }

          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ease-in-out",
                isActive
                  ? "border-green-700 bg-green-50 text-green-800"
                  : "border-transparent text-sidebar-foreground/70 hover:border-green-600 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mr-3 opacity-90" strokeWidth={1.8} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profil utilisateur */}
      <div className="p-4 mt-auto space-y-3 border-t border-sidebar-accent/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">
              {getInitials(user)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user?.role?.replace("_", " ")}
              {user?.magasin?.name ? ` - ${user.magasin.name}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </div>
    </aside>
  );
};
