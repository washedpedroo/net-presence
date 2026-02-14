import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Conferma timbrature di un dipendente per un mese
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
        { error: "Non autorizzato. Solo GP e ADMIN possono confermare" },
        { status: 403 }
      );
    }

    const { employeeId, anno, mese } = await request.json();

    if (!employeeId || !anno || !mese) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    // Aggiorna tutte le timbrature del dipendente per quel mese
    const result = await prisma.timbratura.updateMany({
      where: {
        employeeId,
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "BOZZA"
      },
      data: {
        stato: "CONFERMATO_GP",
        confermatoGpAt: new Date(),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "CONFERMA_TIMBRATURE_GP",
        entita: "Timbratura",
        dettagli: JSON.stringify({ employeeId, anno, mese, count: result.count }),
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} timbrature confermate`,
      count: result.count
    });
  } catch (error) {
    console.error("Errore conferma timbrature:", error);
    return NextResponse.json(
      { error: "Errore nella conferma delle timbrature" },
      { status: 500 }
    );
  }
}
