import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.jpg";

export const createPDFDoc = async (title: string, data: any[][], columns: string[], fileName: string) => {
  const doc = new jsPDF("p", "pt");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Convertir logo en base64
  const toBase64 = (url: string) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Impossible de charger le logo");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = reject;
      img.src = url;
    });

  const logoBase64 = await toBase64(logo);

  // Ajouter header
  const addHeader = () => {
    const logoWidth = 90;
    const logoHeight = 90;
    const logoX = pageWidth - logoWidth - 50;
    const logoY = 45;
    doc.addImage(logoBase64, "JPEG", logoX, logoY, logoWidth, logoHeight);

    const startX = 60;
    let y = 55;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Espace Chrétien des Actions en Redressement de Tsihombe", startX, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text('ASSOCIATION "E.C.A.R.T"', startX + 85, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.text("Récépissé : N° 39-2012/REG/ANDROY/CR/SG/DAGT/ASS", startX, y);
    y += 12;
    doc.text("NIF N°: 6002559762", startX + 60, y);
    y += 12;
    doc.text("STAT : 88101620213000298", startX + 40, y);
    y += 12;
    doc.text("Téléphone(s): 033 91 635 59 / 034 80 893 01", startX, y);
    y += 12;
    doc.text("E-mail: ecarmada4@gmail.com", startX + 60, y);
    y += 20;

    // Ligne séparatrice
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    // Titre PDF
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageWidth / 2, y, { align: "center" });
    return y + 20;
  };

  const startY = addHeader();

  // Tableau
  autoTable(doc, {
    startY,
    head: [columns],
    body: data,
    styles: { fontSize: 8, cellPadding: 5, halign: "center", valign: "middle" },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`Page ${currentPage}`, pageWidth - 80, pageHeight - 20);
    },
  });

  doc.save(fileName);
};
