import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Legge tutte le configurazioni
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const configurazioni = await prisma.configuration.findMany({
      orderBy: { chiave: "asc" },
    });

    // Restituisce come oggetto chiave → valore per comodità frontend
    const config: Record<string, string> = {};
    configurazioni.forEach((c) => {
      config[c.chiave] = c.valore;
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Errore GET configurazioni:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

// POST - Salva o aggiorna configurazioni
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
        { error: "Solo ADMIN può modificare le configurazioni" },
        { status: 403 }
      );
    }

    const body: Record<string, string> = await request.json();

    const chiaviPermesse = [
      "ORE_STANDARD",
      "TOLLERANZA_MINUTI",
      "SESSION_TIMEOUT_ORE",
    ];

    const updates = await Promise.all(
      Object.entries(body)
        .filter(([chiave]) => chiaviPermesse.includes(chiave))
        .map(([chiave, valore]) =>
          prisma.configuration.upsert({
            where: { chiave },
            update: { valore },
            create: { chiave, valore },
          })
        )
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "UPDATE_CONFIGURAZIONI",
        entita: "Configuration",
        dettagli: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("Errore POST configurazioni:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
