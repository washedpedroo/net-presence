import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timbraturaSchema } from "@/lib/validations";
import { calcolaOreLavorate } from "@/lib/utils";

// GET - Ottieni timbrature per dipendente e periodo
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const anno = searchParams.get("anno");
    const mese = searchParams.get("mese");

    if (!employeeId || !anno || !mese) {
      return NextResponse.json(
        { error: "Parametri mancanti: employeeId, anno, mese" },
        { status: 400 }
      );
    }

    // Verifica permessi
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    // Solo GP e ADMIN possono vedere timbrature di altri
    // DIPENDENTE può vedere solo le proprie
    if (
      user.ruolo === "DIPENDENTE" &&
      user.employee?.id !== employeeId
    ) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const timbrature = await prisma.timbratura.findMany({
      where: {
        employeeId,
        anno: parseInt(anno),
        mese: parseInt(mese),
      },
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
        versions: {
          orderBy: {
            modificatoAt: 'desc'
          }
        }
      },
      orderBy: {
        data: 'asc'
      }
    });

    return NextResponse.json(timbrature);
  } catch (error) {
    console.error("Errore GET timbrature:", error);
    return NextResponse.json(
      { error: "Errore nel recupero delle timbrature" },
      { status: 500 }
    );
  }
}

// POST - Crea o aggiorna timbratura
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
        { error: "Non autorizzato. Solo GP e ADMIN possono inserire timbrature" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Converti stringhe vuote in null per i campi opzionali
    const sanitized = {
      ...body,
      entrata1: body.entrata1 || null,
      uscita1: body.uscita1 || null,
      entrata2: body.entrata2 || null,
      uscita2: body.uscita2 || null,
    };

    // Validazione
    const validated = timbraturaSchema.parse(sanitized);

    // Calcola ore e straordinari
    const calcolo = calcolaOreLavorate(
      validated.entrata1,
      validated.uscita1,
      validated.entrata2,
      validated.uscita2
    );

    if (calcolo.errori.length > 0) {
      return NextResponse.json(
        { error: "Errori di validazione", dettagli: calcolo.errori },
        { status: 400 }
      );
    }

    const dataTimbratura = new Date(validated.data);
    const anno = dataTimbratura.getFullYear();
    const mese = dataTimbratura.getMonth() + 1;

    // Cerca timbratura esistente
    const esistente = await prisma.timbratura.findUnique({
      where: {
        employeeId_data: {
          employeeId: validated.employeeId,
          data: dataTimbratura,
        }
      }
    });

    if (esistente?.bloccato && user.ruolo !== "ADMIN") {
      return NextResponse.json(
        { error: "Timbratura bloccata dall'AD. Contatta un amministratore per sbloccarla." },
        { status: 403 }
      );
    }

    let timbratura;

    if (esistente) {
      // Aggiorna e crea versione
      await prisma.timbraturaVersion.create({
        data: {
          timbraturaId: esistente.id,
          versione: esistente.versione,
          entrata1: esistente.entrata1,
          uscita1: esistente.uscita1,
          entrata2: esistente.entrata2,
          uscita2: esistente.uscita2,
          oreLavorate: esistente.oreLavorate,
          straordinari: esistente.straordinari,
          modificatoDa: session.user.id,
        }
      });

      timbratura = await prisma.timbratura.update({
        where: { id: esistente.id },
        data: {
          entrata1: validated.entrata1,
          uscita1: validated.uscita1,
          entrata2: validated.entrata2,
          uscita2: validated.uscita2,
          oreLavorate: calcolo.oreLavorate,
          straordinari: calcolo.straordinari,
          versione: esistente.versione + 1,
          updatedBy: session.user.id,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          azione: "UPDATE_TIMBRATURA",
          entita: "Timbratura",
          entitaId: timbratura.id,
          dettagli: JSON.stringify({ data: dataTimbratura, calcolo }),
        }
      });
    } else {
      // Crea nuova
      timbratura = await prisma.timbratura.create({
        data: {
          employeeId: validated.employeeId,
          data: dataTimbratura,
          anno,
          mese,
          entrata1: validated.entrata1,
          uscita1: validated.uscita1,
          entrata2: validated.entrata2,
          uscita2: validated.uscita2,
          oreLavorate: calcolo.oreLavorate,
          straordinari: calcolo.straordinari,
          createdBy: session.user.id,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          azione: "CREATE_TIMBRATURA",
          entita: "Timbratura",
          entitaId: timbratura.id,
          dettagli: JSON.stringify({ data: dataTimbratura, calcolo }),
        }
      });
    }

    return NextResponse.json(timbratura, { status: esistente ? 200 : 201 });
  } catch (error: any) {
    console.error("Errore POST timbratura:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dati non validi", dettagli: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Errore nella creazione della timbratura" },
      { status: 500 }
    );
  }
}
