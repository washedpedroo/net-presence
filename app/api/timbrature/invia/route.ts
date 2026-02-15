import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creaNotificaPerRuolo } from "@/lib/notifiche";

// POST - Invia presenze all'AD per approvazione finale
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "GP" && user.ruolo !== "ADMIN")) {
      return NextResponse.json(
        { error: "Non autorizzato. Solo GP e ADMIN possono inviare le presenze" },
        { status: 403 }
      );
    }

    const { anno, mese } = await request.json();

    if (!anno || !mese) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    // Verifica che non ci siano timbrature ancora in BOZZA
    const inBozza = await prisma.timbratura.findMany({
      where: {
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "BOZZA",
      },
      include: {
        employee: {
          include: { user: { select: { nome: true, cognome: true } } },
        },
      },
    });

    if (inBozza.length > 0) {
      // Raggruppa per dipendente
      const dipendentiNonConfermati = [
        ...new Map(
          inBozza.map((t) => [
            t.employeeId,
            `${t.employee.user.nome} ${t.employee.user.cognome}`,
          ])
        ).values(),
      ];

      return NextResponse.json(
        {
          error: `Impossibile inviare: ci sono timbrature non confermate`,
          dipendentiNonConfermati,
        },
        { status: 400 }
      );
    }

    // Invia all'AD
    const result = await prisma.timbratura.updateMany({
      where: {
        anno: parseInt(anno),
        mese: parseInt(mese),
        stato: "CONFERMATO_GP",
      },
      data: {
        stato: "INVIATO_AD",
        inviatoAdAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "INVIA_PRESENZE_AD",
        entita: "Timbratura",
        dettagli: JSON.stringify({ anno, mese, count: result.count }),
      },
    });

    // Notifica AD
    const meseNome = new Date(parseInt(anno), parseInt(mese) - 1).toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });

    await creaNotificaPerRuolo(
      "AD",
      "PRESENZE_INVIATE",
      `Presenze ${meseNome} pronte per approvazione`,
      `Il GP ha inviato le presenze di ${meseNome} per la tua approvazione (${result.count} timbrature).`
    );

    return NextResponse.json({
      success: true,
      message: `Presenze inviate all'AD per approvazione`,
      count: result.count,
    });
  } catch (error) {
    console.error("Errore invio presenze:", error);
    return NextResponse.json(
      { error: "Errore nell'invio delle presenze" },
      { status: 500 }
    );
  }
}
