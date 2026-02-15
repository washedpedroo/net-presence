import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Ottieni notifiche dell'utente corrente
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const nonLette = searchParams.get("non_lette") === "true";

    const notifiche = await prisma.notifica.findMany({
      where: {
        userId: session.user.id,
        ...(nonLette ? { letta: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifiche);
  } catch (error) {
    console.error("Errore GET notifiche:", error);
    return NextResponse.json(
      { error: "Errore nel recupero delle notifiche" },
      { status: 500 }
    );
  }
}
