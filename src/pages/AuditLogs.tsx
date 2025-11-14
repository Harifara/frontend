// src/pages/audit/AuditLogs.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { FileText, Search, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.jpg";

interface UserInfo {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface AuditLog {
  id: string;
  user_info: UserInfo | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  timestamp: string;
  ip_address: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      await authApi.fetchKongToken();
      const data = await authApi.getAuditLogs();
      setLogs(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les logs d’audit.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      (log.user_info?.username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    const doc = new jsPDF("p", "pt");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const toBase64 = (url: string) =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Erreur de chargement du logo");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = reject;
        img.src = url;
      });

    const logoBase64 = await toBase64(logo);

    const addHeader = () => {
      const logoWidth = 60;
      const logoHeight = 60;
      doc.addImage(
        logoBase64,
        "JPEG",
        pageWidth - logoWidth - 40,
        30,
        logoWidth,
        logoHeight
      );

      let y = 40;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("LOGS D’AUDIT", pageWidth / 2, y, { align: "center" });
      y += 20;
      doc.setLineWidth(0.3);
      doc.line(40, y, pageWidth - 40, y);
      return y + 10;
    };

    const startY = addHeader();

    autoTable(doc, {
      startY,
      head: [["Date & Heure", "Utilisateur", "Action", "Ressource"]],
      body: filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.user_info ? log.user_info.full_name || log.user_info.username : "Système",
        log.action,
        log.entity_type || "-",
      ]),
      styles: { fontSize: 8, cellPadding: 5, halign: "center", valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth - 80, pageHeight - 20);
      },
    });

    doc.save("audit-logs.pdf");
  };

  if (isLoading)
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Logs d’audit
        </h1>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par utilisateur, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <button
          onClick={exportPDF}
          className="px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Exporter PDF
        </button>
      </div>

      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="w-5 h-5" />
      Historique d’activité
    </CardTitle>
  </CardHeader>

  <CardContent>
    <div className="border rounded-md">
      {/* Conteneur global du tableau */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Date & Heure</TableHead>
            <TableHead className="text-center">Utilisateur</TableHead>
            <TableHead className="text-center">Action</TableHead>
            <TableHead className="text-center">Ressource</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Conteneur scrollable uniquement pour le corps */}
      <div className="max-h-80 overflow-y-auto">
        <Table>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-center">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {log.user_info ? log.user_info.full_name || log.user_info.username : "Système"}
                </TableCell>
                <TableCell className="text-center">{log.action}</TableCell>
                <TableCell className="text-center">{log.entity_type || "-"}</TableCell>
              </TableRow>
            ))}

            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  Aucun log trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </CardContent>
</Card>

    </div>
  );
};

export default AuditLogs;
