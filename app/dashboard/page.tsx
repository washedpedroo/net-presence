import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, FileText, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: true },
  });

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const annoCorrente = oggi.getFullYear();
  const meseCorrente = oggi.getMonth() + 1;

  // Statistiche per GP e ADMIN
  const statsGP = { dipendenti: 0, timbraturaOggi: 0, bozzeAperte: 0 };
  if (user?.ruolo === "ADMIN" || user?.ruolo === "GP") {
    statsGP.dipendenti = await prisma.employee.count();
    statsGP.timbraturaOggi = await prisma.timbratura.count({ where: { data: oggi } });
    statsGP.bozzeAperte = await prisma.timbratura.count({
      where: { anno: annoCorrente, mese: meseCorrente, stato: "BOZZA" },
    });
  }

  // Statistiche per AD e ADMIN
  const statsAD = { giustificativiPending: 0, presenzeInviateAD: 0 };
  if (user?.ruolo === "AD" || user?.ruolo === "ADMIN") {
    statsAD.giustificativiPending = await prisma.giustificativo.count({ where: { stato: "PENDING" } });
    statsAD.presenzeInviateAD = await prisma.timbratura.count({ where: { stato: "INVIATO_AD" } });
  }

  // Statistiche per DIPENDENTE
  const statsDip = { giustPending: 0, giustApprovati: 0 };
  if (user?.ruolo === "DIPENDENTE" && user.employee) {
    statsDip.giustPending = await prisma.giustificativo.count({
      where: { employeeId: user.employee.id, stato: "PENDING" },
    });
    statsDip.giustApprovati = await prisma.giustificativo.count({
      where: {
        employeeId: user.employee.id,
        stato: "APPROVATO",
        dataInizio: { gte: new Date(annoCorrente, meseCorrente - 1, 1) },
      },
    });
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN": return "Amministratore";
      case "AD": return "Amministratore Delegato";
      case "GP": return "Gestore Presenze";
      case "DIPENDENTE": return "Dipendente";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Benvenuto, {user?.nome}
        </h1>
        <p className="text-gray-600 mt-1">
          {getRoleName(user?.ruolo || "")} — {oggi.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI per AD */}
      {(user?.ruolo === "AD" || user?.ruolo === "ADMIN") && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Da Approvare</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/dashboard/giustificativi">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Giustificativi in Attesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {statsAD.giustificativiPending}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Richiedono approvazione</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/timbrature">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Presenze da Approvare
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {statsAD.presenzeInviateAD}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Timbrature inviate dal GP</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* KPI per GP/ADMIN */}
      {(user?.ruolo === "ADMIN" || user?.ruolo === "GP") && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Riepilogo Presenze</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Dipendenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsGP.dipendenti}</div>
                <p className="text-xs text-gray-500 mt-1">Totale attivi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Timbrature Oggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsGP.timbraturaOggi}</div>
                <p className="text-xs text-gray-500 mt-1">{oggi.toLocaleDateString("it-IT")}</p>
              </CardContent>
            </Card>

            <Link href="/dashboard/timbrature">
              <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statsGP.bozzeAperte > 0 ? "border-yellow-300" : ""}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    {statsGP.bozzeAperte > 0
                      ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      : <CheckCircle className="h-4 w-4 text-green-500" />
                    }
                    Bozze Mese Corrente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${statsGP.bozzeAperte > 0 ? "text-yellow-600" : "text-green-600"}`}>
                    {statsGP.bozzeAperte}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {statsGP.bozzeAperte > 0 ? "Non ancora confermate" : "Tutte confermate"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Sezione DIPENDENTE */}
      {user?.ruolo === "DIPENDENTE" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/mie-presenze">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Le Mie Presenze
                </CardTitle>
                <CardDescription>Visualizza il calendario delle tue presenze</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Consulta le ore lavorate, straordinari e stato approvazioni.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/giustificativi">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Giustificativi
                </CardTitle>
                <CardDescription>Gestisci le tue richieste</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  {statsDip.giustPending > 0 && (
                    <span className="text-orange-600 font-medium">
                      {statsDip.giustPending} in attesa
                    </span>
                  )}
                  {statsDip.giustApprovati > 0 && (
                    <span className="text-green-600 font-medium">
                      {statsDip.giustApprovati} approvati questo mese
                    </span>
                  )}
                  {statsDip.giustPending === 0 && statsDip.giustApprovati === 0 && (
                    <span className="text-gray-500">Nessuna richiesta questo mese</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
