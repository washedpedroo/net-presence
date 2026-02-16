import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";
import crypto from "crypto";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function formatOre(ore: number): string {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getStatoColor(stato: string): string {
  switch (stato) {
    case "APPROVATO": return "#16a34a";
    case "INVIATO_AD": return "#2563eb";
    case "CONFERMATO_GP": return "#7c3aed";
    case "BOZZA": return "#9ca3af";
    default: return "#6b7280";
  }
}

function getStatoLabel(stato: string): string {
  switch (stato) {
    case "APPROVATO": return "Approvato";
    case "INVIATO_AD": return "Inviato AD";
    case "CONFERMATO_GP": return "Conf. GP";
    case "BOZZA": return "Bozza";
    default: return stato;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "GP" && user.ruolo !== "AD" && user.ruolo !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const anno = parseInt(searchParams.get("anno") || new Date().getFullYear().toString());
    const mese = parseInt(searchParams.get("mese") || (new Date().getMonth() + 1).toString());

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId obbligatorio" }, { status: 400 });
    }

    // Carica dati dipendente
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { nome: true, cognome: true, username: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Dipendente non trovato" }, { status: 404 });
    }

    // Carica timbrature del mese
    const timbrature = await prisma.timbratura.findMany({
      where: { employeeId, anno, mese },
      orderBy: { data: "asc" },
    });

    // Carica giustificativi del mese
    const giustificativi = await prisma.giustificativo.findMany({
      where: {
        employeeId,
        dataInizio: { lte: new Date(anno, mese, 0) },
        dataFine: { gte: new Date(anno, mese - 1, 1) },
      },
      orderBy: { dataInizio: "asc" },
    });

    const totalOre = timbrature.reduce((acc, t) => acc + t.oreLavorate, 0);
    const totalStraordinari = timbrature.reduce((acc, t) => acc + t.straordinari, 0);
    const giorniLavorati = timbrature.length;
    const ferieGiornate = giustificativi.filter((g) => g.tipo === "FERIE").length;
    const permessiOre = giustificativi
      .filter((g) => g.tipo === "PERMESSO")
      .reduce((acc, g) => acc + (g.oreTotali ?? 0), 0);

    // Genera hash SHA256 del contenuto per firma digitale
    const contenutoHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ employeeId, anno, mese, totalOre, totalStraordinari }))
      .digest("hex");

    const dataGenerazione = new Date().toLocaleDateString("it-IT", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // Costruisce la tabella giornaliera
    const righe = timbrature.map((t) => {
      const data = new Date(t.data).toLocaleDateString("it-IT", {
        weekday: "short", day: "2-digit", month: "2-digit",
      });
      const slotMattina = t.entrata1 && t.uscita1 ? `${t.entrata1} – ${t.uscita1}` : "—";
      const slotPomeriggio = t.entrata2 && t.uscita2 ? `${t.entrata2} – ${t.uscita2}` : "—";
      return `
        <tr>
          <td>${data}</td>
          <td>${slotMattina}</td>
          <td>${slotPomeriggio}</td>
          <td>${formatOre(t.oreLavorate)}</td>
          <td>${t.straordinari > 0 ? formatOre(t.straordinari) : "—"}</td>
          <td><span class="badge" style="background:${getStatoColor(t.stato)}20; color:${getStatoColor(t.stato)}; border:1px solid ${getStatoColor(t.stato)}40">${getStatoLabel(t.stato)}</span></td>
          <td class="note-cell">${t.note ?? ""}</td>
        </tr>`;
    }).join("");

    const righeGiust = giustificativi.length > 0
      ? giustificativi.map((g) => {
          const inizio = new Date(g.dataInizio).toLocaleDateString("it-IT");
          const fine = g.dataFine ? new Date(g.dataFine).toLocaleDateString("it-IT") : inizio;
          const tipoLabel = g.tipo === "FERIE" ? "Ferie" : g.tipo === "PERMESSO" ? "Permesso" : "Ex Festività";
          const statoLabel = g.stato === "APPROVATO" ? "Approvato" : g.stato === "PENDING" ? "In attesa" : "Rifiutato";
          const statoColor = g.stato === "APPROVATO" ? "#16a34a" : g.stato === "PENDING" ? "#d97706" : "#dc2626";
          return `
            <tr>
              <td>${tipoLabel}</td>
              <td>${inizio}</td>
              <td>${fine}</td>
              <td>${g.oreTotali != null ? `${g.oreTotali}h` : "—"}</td>
              <td><span class="badge" style="background:${statoColor}20; color:${statoColor}; border:1px solid ${statoColor}40">${statoLabel}</span></td>
            </tr>`;
        }).join("")
      : `<tr><td colspan="5" style="text-align:center; color:#9ca3af">Nessun giustificativo</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; background: white; }

  .watermark {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80px; font-weight: bold;
    color: rgba(220, 38, 38, 0.06);
    pointer-events: none; z-index: 0;
    white-space: nowrap;
  }

  .content { position: relative; z-index: 1; padding: 30px 40px; }

  .header { border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .company { font-size: 18px; font-weight: bold; color: #1e40af; }
  .doc-title { font-size: 14px; font-weight: bold; color: #374151; margin-top: 4px; }
  .confidential { font-size: 10px; color: #dc2626; font-weight: bold; border: 1px solid #dc2626; padding: 2px 6px; border-radius: 3px; }

  .dipendente-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; }
  .dipendente-box h2 { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .info-row { display: flex; gap: 8px; }
  .info-label { color: #6b7280; min-width: 80px; }

  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; text-align: center; }
  .kpi-value { font-size: 18px; font-weight: bold; color: #1e40af; }
  .kpi-label { font-size: 9px; color: #6b7280; margin-top: 2px; }

  h3 { font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
  th { background: #1e40af; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  tr:nth-child(even) td { background: #f9fafb; }
  .note-cell { color: #6b7280; max-width: 160px; }
  .badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; white-space: nowrap; }

  .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
  .signature { font-size: 9px; color: #9ca3af; font-family: monospace; word-break: break-all; }
</style>
</head>
<body>
<div class="watermark">CONFIDENZIALE</div>
<div class="content">
  <div class="header">
    <div class="header-top">
      <div>
        <div class="company">Net Presence</div>
        <div class="doc-title">Registro Presenze — ${MESI[mese - 1]} ${anno}</div>
      </div>
      <div class="confidential">CONFIDENZIALE</div>
    </div>
  </div>

  <div class="dipendente-box">
    <h2>${employee.user.nome} ${employee.user.cognome}</h2>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Username:</span> <span>${employee.user.username}</span></div>
      <div class="info-row"><span class="info-label">Matricola:</span> <span>${employee.matricola ?? "—"}</span></div>
      <div class="info-row"><span class="info-label">Periodo:</span> <span>${MESI[mese - 1]} ${anno}</span></div>
      <div class="info-row"><span class="info-label">Generato:</span> <span>${dataGenerazione}</span></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">${giorniLavorati}</div>
      <div class="kpi-label">Giorni Lavorati</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value" style="color:#1e40af">${formatOre(totalOre)}</div>
      <div class="kpi-label">Ore Totali</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value" style="color:#d97706">${formatOre(totalStraordinari)}</div>
      <div class="kpi-label">Straordinari</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value" style="color:#7c3aed">${ferieGiornate}gg / ${permessiOre}h</div>
      <div class="kpi-label">Ferie / Permessi</div>
    </div>
  </div>

  <h3>Dettaglio Timbrature</h3>
  ${timbrature.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Mattina</th>
        <th>Pomeriggio</th>
        <th>Ore Lav.</th>
        <th>Straord.</th>
        <th>Stato</th>
        <th>Note</th>
      </tr>
    </thead>
    <tbody>${righe}</tbody>
  </table>` : `<p style="color:#9ca3af; margin-bottom:20px">Nessuna timbratura registrata per questo mese.</p>`}

  <h3>Giustificativi</h3>
  <table>
    <thead>
      <tr>
        <th>Tipo</th>
        <th>Data Inizio</th>
        <th>Data Fine</th>
        <th>Ore Totali</th>
        <th>Stato</th>
      </tr>
    </thead>
    <tbody>${righeGiust}</tbody>
  </table>

  <div class="footer">
    <div>Net Presence — Sistema Gestione Presenze v1.1.0</div>
    <div class="signature">SHA256: ${contenutoHash.substring(0, 32)}...</div>
  </div>
</div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
        printBackground: true,
      });
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="presenze_${employee.user.cognome.toLowerCase()}_${anno}_${mese.toString().padStart(2, "0")}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Errore export PDF:", error);
    return NextResponse.json({ error: "Errore generazione PDF" }, { status: 500 });
  }
}
