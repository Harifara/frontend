import DashboardRH from "./DashboardRH";
import DashboardStock from "./DashboardStock";
import DashboardFinance from "./DashboardFinance";
import DashboardCoordo from "./DashboardCoordo";

export default function DashboardAdmin() {
  return (
    <div className="space-y-6">
      <DashboardRH />
      <DashboardStock />
      <DashboardFinance />
      <DashboardCoordo />
    </div>
  );
}
