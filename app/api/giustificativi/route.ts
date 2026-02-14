import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feriSchema, permessoSchema } from "@/lib/validations";

// GET - Ottieni giustificativi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const stato = searchParams.get("stato");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    const where: any = {};

    // Filtro per dipendente
    if (employeeId) {
      // Solo GP e ADMIN possono vedere giustificativi di altri
      if (user.ruolo === "DIPENDENTE" && user.employee?.id !== employeeId) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      where.employeeId = employeeId;
    } else if (user.ruolo === "DIPENDENTE") {
      // Se dipendente, vede solo i suoi
      where.employeeId = user.employee?.id;
    }

    // Filtro per stato
    if (stato) {
      where.stato = stato;
    }

    const giustificativi = await prisma.giustificativo.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                nome: true,
                cognome: true,
                email: true,
              }
            }
          }
        },
        timeline: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        richiestoAt: 'desc'
      }
    });

    return NextResponse.json(giustificativi);
  } catch (error) {
    console.error("Errore GET giustificativi:", error);
    return NextResponse.json(
      { error: "Errore nel recupero dei giustificativi" },
      { status: 500 }
    );
  }
}

// POST - Crea giustificativo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return NextResponse.json(
        { error: "Solo i dipendenti possono richiedere giustificativi" },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validated: any;
    let oreTotali = 0;

    // Validazione in base al tipo
    if (body.tipo === "FERIE") {
      validated = feriSchema.parse(body);
      // Calcolo giorni lavorativi (semplificato: tutti i giorni tranne weekend)
      const inizio = new Date(validated.dataInizio);
      const fine = new Date(validated.dataFine);
      let giorni = 0;

      for (let d = new Date(inizio); d <= fine; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Non domenica e non sabato
          giorni++;
        }
      }

      oreTotali = giorni * 8; // 8 ore per giorno lavorativo
    } else {
      validated = permessoSchema.parse(body);

      // Calcolo ore permesso
      const [h1, m1] = validated.oraInizio.split(':').map(Number);
      const [h2, m2] = validated.oraFine.split(':').map(Number);
      const minutiTotali = (h2 * 60 + m2) - (h1 * 60 + m1);
      oreTotali = minutiTotali / 60;
    }

    const giustificativo = await prisma.giustificativo.create({
      data: {
        employeeId: user.employee.id,
        tipo: validated.tipo,
        dataInizio: new Date(validated.dataInizio),
        dataFine: validated.dataFine ? new Date(validated.dataFine) : new Date(validated.dataInizio),
        oraInizio: validated.oraInizio || null,
        oraFine: validated.oraFine || null,
        oreTotali,
        descrizione: validated.descrizione,
        stato: "PENDING",
      }
    });

    // Crea timeline entry
    await prisma.giustificativoTimeline.create({
      data: {
        giustificativoId: giustificativo.id,
        stato: "PENDING",
        nota: "Richiesta inviata",
        userId: session.user.id,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "CREATE_GIUSTIFICATIVO",
        entita: "Giustificativo",
        entitaId: giustificativo.id,
        dettagli: JSON.stringify({ tipo: validated.tipo, oreTotali }),
      }
    });

    return NextResponse.json(giustificativo, { status: 201 });
  } catch (error: any) {
    console.error("Errore POST giustificativo:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dati non validi", dettagli: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Errore nella creazione del giustificativo" },
      { status: 500 }
    );
  }
}
