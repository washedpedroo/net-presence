import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Invia presenze all'AD per approvazione finale
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.ruolo === "DIPENDENTE") {
      return NextResponse.json(
        { error: "Non autorizzato. Solo GP e ADMIN" },
        { status: 403 }
      );
    }

    const { anno, mese } = await request.json();

    if (!anno || !mese) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    // Verifica che tutte le timbrature siano confermate
    const nonConfermate = await prisma.timbratura.count({
      where: {
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "BOZZA"
      }
    });

    if (nonConfermate > 0) {
      return NextResponse.json(
        { error: `Ci sono ancora ${nonConfermate} timbrature non confermate` },
        { status: 400 }
      );
    }

    // Invia all'AD
    const result = await prisma.timbratura.updateMany({
      where: {
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "CONFERMATO_GP"
      },
      data: {
        stato: "INVIATO_AD",
        inviatoAdAt: new Date(),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "INVIA_PRESENZE_AD",
        entita: "Timbratura",
        dettagli: JSON.stringify({ anno, mese, count: result.count }),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Presenze inviate all'AD per approvazione`,
      count: result.count
    });
  } catch (error) {
    console.error("Errore invio presenze:", error);
    return NextResponse.json(
      { error: "Errore nell'invio delle presenze" },
      { status: 500 }
    );
  }
}
