import React, { useEffect, useState } from "react";
import { financeApi } from "@/lib/api";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DecaissementsValides() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getDecaissements().then(res => {
      const list = res.results || res;
      setData(list.filter((d: any) => d.statut === "approuve"));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader2 className="animate-spin m-8" />;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Décaissements validés</h1>

      <Card>
        <CardHeader><CardTitle>Validés</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.reference || d.id}</TableCell>
                  <TableCell>{d.montant_total.toLocaleString()} Ar</TableCell>
                  <TableCell>{new Date(d.date_creation).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
