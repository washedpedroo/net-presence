import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";
import archiver from "archiver";
import { PassThrough } from "stream";

const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

async function generaPdfRiepilogo(
  employee: { user: { nome: string; cognome: string; email: string } },
  timbrature: any[],
  giustificativi: any[],
  auditLogs: any[]
): Promise<Buffer> {
  const totalOre = timbrature.reduce((acc: number, t: any) => acc + t.oreLavorate, 0);
  const totalStraordinari = timbrature.reduce((acc: number, t: any) => acc + t.straordinari, 0);

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; margin: 0; padding: 30px 40px; }
  h1 { font-size: 18px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 16px; }
  h2 { font-size: 13px; color: #374151; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .meta { color: #6b7280; font-size: 10px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
  th { background: #1e40af; color: white; padding: 5px 8px; text-align: left; }
  td { padding: 4px 8px; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) td { background: #f9fafb; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; text-align: center; }
  .kpi-v { font-size: 16px; font-weight: bold; color: #1e40af; }
  .kpi-l { font-size: 9px; color: #6b7280; }
  .footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 9px; color: #9ca3af; }
</style>
</head>
<body>
  <h1>Export GDPR — Dati Personali</h1>
  <div class="meta">
    <strong>${employee.user.nome} ${employee.user.cognome}</strong> &lt;${employee.user.email}&gt;<br>
    Generato il: ${new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-v">${timbrature.length}</div><div class="kpi-l">Timbrature Totali</div></div>
    <div class="kpi"><div class="kpi-v">${totalOre.toFixed(1)}h</div><div class="kpi-l">Ore Lavorate</div></div>
    <div class="kpi"><div class="kpi-v">${giustificativi.length}</div><div class="kpi-l">Giustificativi</div></div>
  </div>

  <h2>Ultime 20 Timbrature</h2>
  <table>
    <thead><tr><th>Data</th><th>Entrata 1</th><th>Uscita 1</th><th>Entrata 2</th><th>Uscita 2</th><th>Ore</th><th>Stato</th></tr></thead>
    <tbody>
      ${timbrature.slice(-20).map((t: any) => `
        <tr>
          <td>${new Date(t.data).toLocaleDateString("it-IT")}</td>
          <td>${t.entrata1 ?? "—"}</td>
          <td>${t.uscita1 ?? "—"}</td>
          <td>${t.entrata2 ?? "—"}</td>
          <td>${t.uscita2 ?? "—"}</td>
          <td>${t.oreLavorate}h</td>
          <td>${t.stato}</td>
        </tr>`).join("")}
    </tbody>
  </table>

  <h2>Giustificativi</h2>
  <table>
    <thead><tr><th>Tipo</th><th>Data Inizio</th><th>Data Fine</th><th>Ore</th><th>Stato</th></tr></thead>
    <tbody>
      ${giustificativi.length > 0
        ? giustificativi.map((g: any) => `
          <tr>
            <td>${g.tipo}</td>
            <td>${new Date(g.dataInizio).toLocaleDateString("it-IT")}</td>
            <td>${g.dataFine ? new Date(g.dataFine).toLocaleDateString("it-IT") : "—"}</td>
            <td>${g.oreTotali ?? "—"}</td>
            <td>${g.stato}</td>
          </tr>`).join("")
        : `<tr><td colspan="5" style="text-align:center;color:#9ca3af">Nessun giustificativo</td></tr>`}
    </tbody>
  </table>

  <h2>Ultimi 10 Log di Audit</h2>
  <table>
    <thead><tr><th>Data</th><th>Azione</th><th>Entità</th></tr></thead>
    <tbody>
      ${auditLogs.slice(-10).map((l: any) => `
        <tr>
          <td>${new Date(l.createdAt).toLocaleDateString("it-IT")}</td>
          <td>${l.azione}</td>
          <td>${l.entita ?? "—"}</td>
        </tr>`).join("")}
    </tbody>
  </table>

  <div class="footer">
    Net Presence — Export GDPR conforme al Reg. EU 2016/679 | Straordinari totali: ${totalStraordinari.toFixed(1)}h
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
    return Buffer.from(pdf);
  } finally {
    await browser.close();
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
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    const requestedEmployeeId = request.nextUrl.searchParams.get("employeeId");

    // DIPENDENTE può scaricare solo i propri dati
    let employeeId: string;
    if (user.ruolo === "DIPENDENTE") {
      if (!user.employee) {
        return NextResponse.json({ error: "Profilo dipendente non trovato" }, { status: 404 });
      }
      employeeId = user.employee.id;
    } else if (user.ruolo === "ADMIN" || user.ruolo === "GP" || user.ruolo === "AD") {
      if (!requestedEmployeeId) {
        return NextResponse.json({ error: "employeeId obbligatorio" }, { status: 400 });
      }
      employeeId = requestedEmployeeId;
    } else {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    // Carica dati dipendente
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true, nome: true, cognome: true, email: true, createdAt: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Dipendente non trovato" }, { status: 404 });
    }

    // Carica tutti i dati storici
    const [timbrature, giustificativi, auditLogs] = await Promise.all([
      prisma.timbratura.findMany({
        where: { employeeId },
        orderBy: { data: "asc" },
      }),
      prisma.giustificativo.findMany({
        where: { employeeId },
        orderBy: { dataInizio: "asc" },
      }),
      prisma.auditLog.findMany({
        where: { userId: employee.user.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Genera PDF riepilogo
    const pdfBuffer = await generaPdfRiepilogo(employee, timbrature, giustificativi, auditLogs);

    // Audit log dell'azione GDPR_EXPORT
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "GDPR_EXPORT",
        entita: "Employee",
        entitaId: employeeId,
        dettagli: JSON.stringify({
          timbrature: timbrature.length,
          giustificativi: giustificativi.length,
          auditLogs: auditLogs.length,
        }),
      },
    });

    // Crea archivio ZIP in memoria
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(passThrough);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const nomeFile = `${employee.user.cognome.toLowerCase()}_${employee.user.nome.toLowerCase()}`;

    // Dati anagrafici
    archive.append(
      JSON.stringify({ ...employee.user, employeeId: employee.id, matricola: employee.matricola }, null, 2),
      { name: "dati_anagrafici.json" }
    );

    // Timbrature
    archive.append(
      JSON.stringify(timbrature.map((t) => ({
        data: t.data, entrata1: t.entrata1, uscita1: t.uscita1,
        entrata2: t.entrata2, uscita2: t.uscita2, oreLavorate: t.oreLavorate,
        straordinari: t.straordinari, stato: t.stato, note: t.note,
      })), null, 2),
      { name: "timbrature.json" }
    );

    // Giustificativi
    archive.append(
      JSON.stringify(giustificativi.map((g) => ({
        tipo: g.tipo, dataInizio: g.dataInizio, dataFine: g.dataFine,
        oraInizio: g.oraInizio, oraFine: g.oraFine,
        oreTotali: g.oreTotali, stato: g.stato, note: g.note,
      })), null, 2),
      { name: "giustificativi.json" }
    );

    // Audit log
    archive.append(
      JSON.stringify(auditLogs.map((l) => ({
        data: l.createdAt, azione: l.azione, entita: l.entita,
      })), null, 2),
      { name: "audit_log.json" }
    );

    // PDF riepilogo
    archive.append(pdfBuffer, { name: "riepilogo_gdpr.pdf" });

    await archive.finalize();

    await new Promise<void>((resolve) => passThrough.on("end", resolve));
    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="gdpr_export_${nomeFile}_${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error("Errore export GDPR:", error);
    return NextResponse.json({ error: "Errore generazione export GDPR" }, { status: 500 });
  }
}
