import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Approva o rigetta giustificativo (solo ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.ruolo !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorizzato. Solo ADMIN può approvare giustificativi" },
        { status: 403 }
      );
    }

    const { giustificativoId, azione, motivazione } = await request.json();

    if (!giustificativoId || !azione) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    if (!["APPROVA", "RIGETTA"].includes(azione)) {
      return NextResponse.json(
        { error: "Azione non valida" },
        { status: 400 }
      );
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
        ...(azione === "RIGETTA" && { motivazioneRigetto: motivazione })
      }
    });

    // Crea timeline entry
    await prisma.giustificativoTimeline.create({
      data: {
        giustificativoId: giustificativo.id,
        stato: nuovoStato,
        nota: azione === "APPROVA" ? "Approvato" : motivazione,
        userId: session.user.id,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: `${azione}_GIUSTIFICATIVO`,
        entita: "Giustificativo",
        entitaId: giustificativo.id,
        dettagli: JSON.stringify({ motivazione }),
      }
    });

    return NextResponse.json(giustificativo);
  } catch (error) {
    console.error("Errore approvazione giustificativo:", error);
    return NextResponse.json(
      { error: "Errore nell'approvazione del giustificativo" },
      { status: 500 }
    );
  }
}
