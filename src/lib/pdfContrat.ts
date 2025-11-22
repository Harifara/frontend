import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.jpg";

export const createContratPDF = async (contrat: any) => {
  const doc = new jsPDF("p", "pt");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Convertir l'image en Base64
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

  // ---------------- HEADER PDF ----------------
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

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(40, y, pageWidth - 40, y);

    y += 30;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRAT", pageWidth / 2, y, { align: "center" });

    return y + 25;
  };

  let cursorY = addHeader();

  // ---------------- HELPERS ----------------
  const safe = (val: any) => val || "-";

  const sectionTitle = (title: string) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 60, cursorY);
    cursorY += 15;
  };

  const textLine = (label: string, value: any) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${label}:`, 60, cursorY);
    doc.text(`${safe(value)}`, 180, cursorY);
    cursorY += 15;
  };

  // ---------------- SECTION 1 ----------------
  sectionTitle("Informations de l'employé");

  textLine("Nom complet", contrat.employer?.full_name);
  textLine("Poste / Fonction", contrat.type_contrat?.nom_type);
  textLine("Nature du contrat", contrat.nature_label ?? contrat.nature_contrat);
  textLine("Statut du contrat", contrat.status_label ?? contrat.status_contrat);

  cursorY += 10;

  // ---------------- SECTION 2 ----------------
  sectionTitle("Durée du contrat");
  textLine("Date de début", contrat.date_debut_contrat);
  textLine("Date de fin", contrat.date_fin_contrat);
  textLine("Durée (jours)", contrat.duree_jours ? `${contrat.duree_jours} jours` : "-");

  cursorY += 10;

  // ---------------- SECTION 3 ----------------
  sectionTitle("Rémunération");

  const formatMoney = (x: any) => {
    if (!x) return "-";
    return new Intl.NumberFormat("fr-FR").format(Number(x)) + " Ar";
  };

  textLine("Salaire", formatMoney(contrat.salaire));
  textLine("Montant total", formatMoney(contrat.montant_total));

  cursorY += 10;

  // ---------------- SECTION 4 ----------------
  if (contrat.description_mission) {
    sectionTitle("Description de la mission");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const splitDesc = doc.splitTextToSize(
      contrat.description_mission,
      pageWidth - 120
    );

    doc.text(splitDesc, 60, cursorY);
    cursorY += splitDesc.length * 12 + 10;
  }

  // ---------------- SIGNATURES ----------------
  cursorY += 30;
  sectionTitle("Signatures");

  doc.setFontSize(10);
  doc.text("Signature Employeur:", 60, cursorY + 40);
  doc.line(60, cursorY + 60, 260, cursorY + 60);

  doc.text("Signature Employé:", pageWidth - 220, cursorY + 40);
  doc.line(pageWidth - 220, cursorY + 60, pageWidth - 40, cursorY + 60);

  // ---------------- FOOTER ----------------
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Document généré automatiquement par ECART – Système de gestion.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  const fileName = `Contrat_${safe(contrat?.employer?.full_name)}.pdf`;
  doc.save(fileName);
};
