import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcrypt";

// GET - Ottieni tutti gli utenti (solo ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.ruolo !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Rimuovi passwordHash dalla risposta
    const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error("Errore GET users:", error);
    return NextResponse.json(
      { error: "Errore nel recupero degli utenti" },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo utente (solo ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!adminUser || adminUser.ruolo !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Genera username univoco nel formato nome.cognome
    const baseUsername = `${validated.nome.toLowerCase().replace(/\s+/g, "")}.${validated.cognome.toLowerCase().replace(/\s+/g, "")}`;
    let username = baseUsername;
    let suffix = 2;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Crea utente
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        nome: validated.nome,
        cognome: validated.cognome,
        ruolo: validated.ruolo,
      }
    });

    // Se è DIPENDENTE, crea anche l'employee
    if (validated.ruolo === "DIPENDENTE") {
      await prisma.employee.create({
        data: {
          userId: user.id,
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "CREATE_USER",
        entita: "User",
        entitaId: user.id,
        dettagli: JSON.stringify({ username: user.username, ruolo: user.ruolo }),
      }
    });

    return NextResponse.json(
      { ...user, passwordHash: undefined },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Errore POST user:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dati non validi", dettagli: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Errore nella creazione dell'utente" },
      { status: 500 }
    );
  }
}
