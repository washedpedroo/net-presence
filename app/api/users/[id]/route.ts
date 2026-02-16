import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Aggiorna ruolo o stato attivo utente (solo ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin || admin.ruolo !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { id } = params;
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Non puoi modificare il tuo stesso account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    const body = await request.json();
    const { ruolo, attivo } = body;

    const ruoliValidi = ["ADMIN", "AD", "GP", "DIPENDENTE"];
    if (ruolo !== undefined && !ruoliValidi.includes(ruolo)) {
      return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(ruolo !== undefined ? { ruolo } : {}),
        ...(attivo !== undefined ? { attivo } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: ruolo !== undefined ? "UPDATE_RUOLO" : "UPDATE_STATO_UTENTE",
        entita: "User",
        entitaId: id,
        dettagli: JSON.stringify({ ruolo, attivo }),
      },
    });

    const { passwordHash: _, ...userSafe } = updated;
    return NextResponse.json(userSafe);
  } catch (error) {
    console.error("Errore PATCH user:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 });
  }
}

// DELETE - Elimina utente (solo ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin || admin.ruolo !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { id } = params;
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Non puoi eliminare il tuo stesso account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "DELETE_USER",
        entita: "User",
        entitaId: id,
        dettagli: JSON.stringify({ username: target.username, ruolo: target.ruolo }),
      },
    });

    // La cascade su Prisma elimina anche Employee, AuditLog, Notifiche correlati
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore DELETE user:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 });
  }
}
