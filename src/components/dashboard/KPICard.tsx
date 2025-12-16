import { Card } from "@/components/ui/card";

type KPICardProps = {
  icon: React.ElementType;
  label: string;
  value: number | string;
};

export default function KPICard({ icon: Icon, label, value }: KPICardProps) {
  return (
    <Card className="p-4 bg-white rounded-2xl border shadow hover:shadow-lg transition">
      <div className="flex items-center gap-4">
        <Icon className="w-8 h-8 text-slate-700" />
        <div>
          <div className="text-xl font-semibold">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}
