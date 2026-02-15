import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Segna notifica come letta
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // Verifica che la notifica appartenga all'utente corrente
    const notifica = await prisma.notifica.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!notifica) {
      return NextResponse.json(
        { error: "Notifica non trovata" },
        { status: 404 }
      );
    }

    const updated = await prisma.notifica.update({
      where: { id: params.id },
      data: { letta: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Errore PATCH notifica:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della notifica" },
      { status: 500 }
    );
  }
}

// DELETE - Elimina notifica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const notifica = await prisma.notifica.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!notifica) {
      return NextResponse.json(
        { error: "Notifica non trovata" },
        { status: 404 }
      );
    }

    await prisma.notifica.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore DELETE notifica:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione della notifica" },
      { status: 500 }
    );
  }
}
