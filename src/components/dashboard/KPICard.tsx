import { LucideIcon } from "lucide-react";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color?: "blue" | "red" | "green" | "purple" | "yellow" | "orange" | "teal";
}

const colorMap: Record<string, string> = {
  blue: "text-blue-600 bg-blue-100",
  red: "text-red-600 bg-red-100",
  green: "text-green-600 bg-green-100",
  purple: "text-purple-600 bg-purple-100",
  yellow: "text-yellow-600 bg-yellow-100",
  orange: "text-orange-600 bg-orange-100",
  teal: "text-teal-600 bg-teal-100",
};

export default function KPICard({ icon: Icon, label, value, color = "blue" }: KPICardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-between hover:shadow-lg transition">
      <div className={`p-3 rounded-full ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
