import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creaNotifica, creaNotificaPerRuolo } from "@/lib/notifiche";

// POST - Approva o rigetta giustificativo (solo AD e ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "AD" && user.ruolo !== "ADMIN")) {
      return NextResponse.json(
        { error: "Non autorizzato. Solo AD e ADMIN possono approvare giustificativi" },
        { status: 403 }
      );
    }

    const { giustificativoId, azione, motivazione } = await request.json();

    if (!giustificativoId || !azione) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    if (!["APPROVA", "RIGETTA"].includes(azione)) {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    if (azione === "RIGETTA" && !motivazione) {
      return NextResponse.json(
        { error: "Motivazione obbligatoria per il rigetto" },
        { status: 400 }
      );
    }

    const nuovoStato = azione === "APPROVA" ? "APPROVATO" : "RIFIUTATO";
    const dataField = azione === "APPROVA" ? "approvatoAt" : "rigettatoAt";

    const giustificativo = await prisma.giustificativo.update({
      where: { id: giustificativoId },
      data: {
        stato: nuovoStato,
        [dataField]: new Date(),
        approvatoDa: session.user.id,
        ...(azione === "RIGETTA" && { motivazioneRigetto: motivazione }),
      },
      include: {
        employee: {
          include: { user: { select: { id: true, nome: true, cognome: true } } },
        },
      },
    });

    // Crea timeline entry
    await prisma.giustificativoTimeline.create({
      data: {
        giustificativoId: giustificativo.id,
        stato: nuovoStato,
        nota: azione === "APPROVA" ? "Approvato dall'AD" : `Rigettato: ${motivazione}`,
        userId: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: `${azione}_GIUSTIFICATIVO`,
        entita: "Giustificativo",
        entitaId: giustificativo.id,
        dettagli: JSON.stringify({ motivazione }),
      },
    });

    const tipoGiust = giustificativo.tipo === "FERIE" ? "Ferie" : giustificativo.tipo === "PERMESSO" ? "Permesso" : "Ex Festività";
    const dipNome = `${giustificativo.employee.user.nome} ${giustificativo.employee.user.cognome}`;

    // Notifica al dipendente
    await creaNotifica(
      giustificativo.employee.user.id,
      azione === "APPROVA" ? "GIUSTIFICATIVO_APPROVATO" : "GIUSTIFICATIVO_RIFIUTATO",
      azione === "APPROVA" ? `${tipoGiust} approvata` : `${tipoGiust} rigettata`,
      azione === "APPROVA"
        ? `La tua richiesta di ${tipoGiust.toLowerCase()} è stata approvata.`
        : `La tua richiesta di ${tipoGiust.toLowerCase()} è stata rigettata. Motivazione: ${motivazione}`,
      giustificativo.id,
      "Giustificativo"
    );

    // Notifica al GP
    await creaNotificaPerRuolo(
      "GP",
      azione === "APPROVA" ? "GIUSTIFICATIVO_APPROVATO" : "GIUSTIFICATIVO_RIFIUTATO",
      azione === "APPROVA" ? `${tipoGiust} approvata` : `${tipoGiust} rigettata`,
      `La richiesta di ${tipoGiust.toLowerCase()} di ${dipNome} è stata ${azione === "APPROVA" ? "approvata" : "rigettata"}.`,
      giustificativo.id,
      "Giustificativo"
    );

    return NextResponse.json(giustificativo);
  } catch (error) {
    console.error("Errore approvazione giustificativo:", error);
    return NextResponse.json(
      { error: "Errore nell'approvazione del giustificativo" },
      { status: 500 }
    );
  }
}
