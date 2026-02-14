import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Ottieni tutti i dipendenti
export async function GET(request: NextRequest) {
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
        { error: "Non autorizzato" },
        { status: 403 }
      );
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nome: true,
            cognome: true,
            ruolo: true,
            attivo: true,
          }
        },
        template: true
      },
      orderBy: {
        user: {
          cognome: 'asc'
        }
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Errore GET employees:", error);
    return NextResponse.json(
      { error: "Errore nel recupero dei dipendenti" },
      { status: 500 }
    );
  }
}
