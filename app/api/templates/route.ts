import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Ottieni template di un dipendente
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "GP" && user.ruolo !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const employeeId = request.nextUrl.searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId obbligatorio" }, { status: 400 });
    }

    const template = await prisma.employeeTemplate.findUnique({
      where: { employeeId },
    });

    return NextResponse.json(template ?? {});
  } catch (error) {
    console.error("Errore GET template:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

// POST - Crea o aggiorna template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.ruolo !== "GP" && user.ruolo !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { employeeId, applyToAll, ...orari } = await request.json();

    if (!employeeId && !applyToAll) {
      return NextResponse.json({ error: "employeeId obbligatorio" }, { status: 400 });
    }

    const campiPermessi = [
      "lunediEntrata1", "lunediUscita1", "lunediEntrata2", "lunediUscita2",
      "martediEntrata1", "martediUscita1", "martediEntrata2", "martediUscita2",
      "mercolediEntrata1", "mercolediUscita1", "mercolediEntrata2", "mercolediUscita2",
      "giovediEntrata1", "giovediUscita1", "giovediEntrata2", "giovediUscita2",
      "venerdiEntrata1", "venerdiUscita1", "venerdiEntrata2", "venerdiUscita2",
    ];

    const data: Record<string, string | null> = {};
    for (const campo of campiPermessi) {
      data[campo] = orari[campo] ?? null;
    }

    if (applyToAll) {
      // Applica a tutti i dipendenti
      const employees = await prisma.employee.findMany({ select: { id: true } });
      await Promise.all(
        employees.map((emp) =>
          prisma.employeeTemplate.upsert({
            where: { employeeId: emp.id },
            update: data,
            create: { employeeId: emp.id, ...data },
          })
        )
      );

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          azione: "UPDATE_TEMPLATE_ALL",
          entita: "EmployeeTemplate",
          dettagli: JSON.stringify({ applyToAll: true }),
        },
      });

      return NextResponse.json({ success: true, updated: employees.length });
    }

    const template = await prisma.employeeTemplate.upsert({
      where: { employeeId },
      update: data,
      create: { employeeId, ...data },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        azione: "UPDATE_TEMPLATE",
        entita: "EmployeeTemplate",
        entitaId: template.id,
        dettagli: JSON.stringify({ employeeId }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Errore POST template:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
