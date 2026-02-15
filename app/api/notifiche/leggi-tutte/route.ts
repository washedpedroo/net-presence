import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Segna tutte le notifiche come lette
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    await prisma.notifica.updateMany({
      where: { userId: session.user.id, letta: false },
      data: { letta: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore mark all read:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
