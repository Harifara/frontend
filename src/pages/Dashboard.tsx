import { useAuth } from "@/contexts/AuthContext";
import DashboardRH from "./dashboard/DashboardRH";
import DashboardStock from "./dashboard/DashboardStock";
import DashboardFinance from "./dashboard/DashboardFinance";
import DashboardCoordo from "./dashboard/DashboardCoordo";
import DashboardAdmin from "./dashboard/DashboardAdmin";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "admin") return <DashboardAdmin />;
  if (role === "responsable_rh") return <DashboardRH />;
  if (role === "responsable_stock" || role === "magasinier") return <DashboardStock />;
  if (["finance", "responsable_finance"].includes(role || "")) return <DashboardFinance />;
  if (["coordinateur", "coordo"].includes(role || "")) return <DashboardCoordo />;

  return <div className="p-6">Accès non autorisé</div>;
}
