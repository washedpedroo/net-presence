import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Approva o rigetta presenze mensili (solo ADMIN)
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
        { error: "Non autorizzato. Solo ADMIN" },
        { status: 403 }
      );
    }

    const { anno, mese, azione, motivazione } = await request.json();

    if (!anno || !mese || !azione) {
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

    const nuovoStato = azione === "APPROVA" ? "APPROVATO" : "RIGETTATO";
    const dataField = azione === "APPROVA" ? "approvatoAt" : "rigettatoAt";

    const result = await prisma.timbratura.updateMany({
      where: {
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "INVIATO_AD"
      },
      data: {
        stato: nuovoStato,
        [dataField]: new Date(),
        ...(azione === "RIGETTA" && { motivazioneRigetto: motivazione })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: `${azione}_PRESENZE_AD`,
        entita: "Timbratura",
        dettagli: JSON.stringify({ anno, mese, count: result.count, motivazione }),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Presenze ${azione === "APPROVA" ? "approvate" : "rigettate"}`,
      count: result.count
    });
  } catch (error) {
    console.error("Errore approvazione AD:", error);
    return NextResponse.json(
      { error: "Errore nell'approvazione" },
      { status: 500 }
    );
  }
}
