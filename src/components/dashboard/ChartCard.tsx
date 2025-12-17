// src/components/dashboard/ChartCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartCardProps {
  title: string;
  data: { article: string; quantite: number }[];
  barColor: string;
  barName: string;
}

export default function ChartCard({ title, data, barColor, barName }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="article" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantite" fill={barColor} name={barName} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
