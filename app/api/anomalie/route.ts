import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWeekend } from "@/lib/utils";

interface Anomalia {
  tipo: "ORE_INSUFFICIENTI" | "STRAORDINARI_ECCESSIVI" | "TIMBRATURA_MANCANTE";
  employeeId: string;
  nome: string;
  data?: string;
  oreRegistrate?: number;
  totaleStraordinari?: number;
}

// Restituisce tutti i giorni lavorativi (lun-ven) di un mese che non sono festivi
async function getGiorniLavorativi(anno: number, mese: number): Promise<Date[]> {
  const festivita = await prisma.festivita.findMany({
    where: {
      data: {
        gte: new Date(anno, mese - 1, 1),
        lte: new Date(anno, mese, 0),
      },
    },
    select: { data: true },
  });

  const setFestivi = new Set(
    festivita.map((f) => f.data.toISOString().split("T")[0])
  );

  const giorni: Date[] = [];
  const totGiorni = new Date(anno, mese, 0).getDate();

  for (let g = 1; g <= totGiorni; g++) {
    const d = new Date(anno, mese - 1, g);
    const chiave = d.toISOString().split("T")[0];
    if (!isWeekend(d) && !setFestivi.has(chiave)) {
      giorni.push(d);
    }
  }

  return giorni;
}

// GET - Calcola anomalie per anno/mese
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "GP" && user.ruolo !== "AD" && user.ruolo !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const anno = parseInt(searchParams.get("anno") || new Date().getFullYear().toString());
    const mese = parseInt(searchParams.get("mese") || (new Date().getMonth() + 1).toString());

    // Carica tutti i dipendenti
    const employees = await prisma.employee.findMany({
      include: { user: { select: { nome: true, cognome: true } } },
    });

    // Carica tutte le timbrature del mese
    const timbrature = await prisma.timbratura.findMany({
      where: { anno, mese },
      select: {
        employeeId: true,
        data: true,
        oreLavorate: true,
        straordinari: true,
      },
    });

    // Carica giustificativi approvati del mese
    const giustificativi = await prisma.giustificativo.findMany({
      where: {
        stato: "APPROVATO",
        dataInizio: { lte: new Date(anno, mese, 0) },
        dataFine: { gte: new Date(anno, mese - 1, 1) },
      },
      select: {
        employeeId: true,
        tipo: true,
        dataInizio: true,
        dataFine: true,
        oraInizio: true,
        oraFine: true,
        oreTotali: true,
      },
    });

    const giorniLavorativi = await getGiorniLavorativi(anno, mese);
    const anomalie: Anomalia[] = [];

    for (const emp of employees) {
      const nome = `${emp.user.nome} ${emp.user.cognome}`;

      // Mappa timbrature per data
      const timbraturaMap = new Map<string, number>();
      let totaleStraordinari = 0;

      timbrature
        .filter((t) => t.employeeId === emp.id)
        .forEach((t) => {
          const chiave = new Date(t.data).toISOString().split("T")[0];
          timbraturaMap.set(chiave, t.oreLavorate);
          totaleStraordinari += t.straordinari;
        });

      // 1. Check: straordinari > 20h mese
      if (totaleStraordinari > 20) {
        anomalie.push({
          tipo: "STRAORDINARI_ECCESSIVI",
          employeeId: emp.id,
          nome,
          totaleStraordinari: Math.round(totaleStraordinari * 100) / 100,
        });
      }

      // 2. Check per ogni giorno lavorativo
      for (const giorno of giorniLavorativi) {
        const chiave = giorno.toISOString().split("T")[0];

        // Verifica se ha un giustificativo che copre questo giorno
        const haCopertura = giustificativi.some((g) => {
          if (g.employeeId !== emp.id) return false;
          const inizio = new Date(g.dataInizio);
          const fine = g.dataFine ? new Date(g.dataFine) : new Date(g.dataInizio);
          inizio.setHours(0, 0, 0, 0);
          fine.setHours(23, 59, 59, 999);
          return giorno >= inizio && giorno <= fine;
        });

        const oreTimbratura = timbraturaMap.get(chiave) ?? null;

        if (oreTimbratura === null) {
          // Nessuna timbratura
          if (!haCopertura) {
            anomalie.push({
              tipo: "TIMBRATURA_MANCANTE",
              employeeId: emp.id,
              nome,
              data: chiave,
            });
          }
        } else if (oreTimbratura < 7.83 && !haCopertura) {
          // Meno di 8h senza giustificativo (7.83 = 8h - 10min tolleranza)
          anomalie.push({
            tipo: "ORE_INSUFFICIENTI",
            employeeId: emp.id,
            nome,
            data: chiave,
            oreRegistrate: Math.round(oreTimbratura * 100) / 100,
          });
        }
      }
    }

    return NextResponse.json({ anomalie, anno, mese });
  } catch (error) {
    console.error("Errore GET anomalie:", error);
    return NextResponse.json(
      { error: "Errore nel calcolo delle anomalie" },
      { status: 500 }
    );
  }
}
