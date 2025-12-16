import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileSearch,
  MapPin,
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

// Fonction pour initiales utilisateur
const getInitials = (user: any) => {
  if (user?.full_name)
    return user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
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
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-50 flex flex-col backdrop-blur-md">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center h-28 px-4 border-b border-gray-700">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg flex items-center justify-center bg-white">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
        </div>
        <span className="mt-2 text-xl font-bold tracking-wide">E.C.A.R.T</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map(item => {
          if (item.items) {
            const isOpen = openDropdowns.includes(item.name);
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-700/50"
                >
                  <item.icon className="w-5 h-5 mr-3 text-green-400" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isOpen && (
                  <div className="pl-8 space-y-1 transition-all duration-300">
                    {item.items.filter(sub => sub.roles.includes(user.role)).map(sub => {
                      const isActive = location.pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          to={sub.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-green-600 text-white shadow-md"
                              : "hover:bg-gray-700/40 text-gray-300"
                          )}
                        >
                          <sub.icon className="w-5 h-5 mr-3 text-green-300" />
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-green-600 text-white shadow-md"
                  : "hover:bg-gray-700/40 text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5 mr-3 text-green-400" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profil utilisateur */}
      <div className="p-4 mt-auto border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {getInitials(user)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role?.replace("_", " ")}
              {user?.magasin?.name ? ` - ${user.magasin.name}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 bg-gray-700/50 text-white hover:bg-red-600 hover:text-white transition-all"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </div>
    </aside>
  );
};
