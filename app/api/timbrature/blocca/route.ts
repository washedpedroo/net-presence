import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Blocca (conferma AD) le timbrature di un dipendente per un mese
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
        { error: "Non autorizzato. Solo AD e ADMIN possono bloccare le timbrature" },
        { status: 403 }
      );
    }

    const { employeeId, anno, mese } = await request.json();

    if (!employeeId || !anno || !mese) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    const result = await prisma.timbratura.updateMany({
      where: { employeeId, anno, mese },
      data: { bloccato: true, bloccatoAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "BLOCCA_TIMBRATURE",
        entita: "Timbratura",
        entitaId: employeeId,
        dettagli: JSON.stringify({ employeeId, anno, mese, count: result.count }),
      },
    });

    return NextResponse.json({
      message: `Timbrature bloccate con successo (${result.count} record)`,
      count: result.count,
    });
  } catch (error) {
    console.error("Errore blocca timbrature:", error);
    return NextResponse.json(
      { error: "Errore nel blocco delle timbrature" },
      { status: 500 }
    );
  }
}
