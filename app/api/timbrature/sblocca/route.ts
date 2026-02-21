import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Sblocca le timbrature di un dipendente per un mese (solo ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.ruolo !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorizzato. Solo ADMIN può sbloccare le timbrature" },
        { status: 403 }
      );
    }

    const { employeeId, anno, mese } = await request.json();

    if (!employeeId || !anno || !mese) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    const result = await prisma.timbratura.updateMany({
      where: { employeeId, anno, mese },
      data: { bloccato: false, bloccatoAt: null },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "SBLOCCA_TIMBRATURE",
        entita: "Timbratura",
        entitaId: employeeId,
        dettagli: JSON.stringify({ employeeId, anno, mese, count: result.count }),
      },
    });

    return NextResponse.json({
      message: `Timbrature sbloccate con successo (${result.count} record)`,
      count: result.count,
    });
  } catch (error) {
    console.error("Errore sblocca timbrature:", error);
    return NextResponse.json(
      { error: "Errore nello sblocco delle timbrature" },
      { status: 500 }
    );
  }
}
