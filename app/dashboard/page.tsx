import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: true }
  });

  // Statistiche base
  const stats = {
    dipendenti: 0,
    timbraturaOggi: 0,
    giustificativiPending: 0,
    presenzeInviateAD: 0,
  };

  if (user?.ruolo === "ADMIN" || user?.ruolo === "GP") {
    stats.dipendenti = await prisma.employee.count();

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    stats.timbraturaOggi = await prisma.timbratura.count({
      where: {
        data: oggi,
      }
    });

    stats.giustificativiPending = await prisma.giustificativo.count({
      where: {
        stato: user.ruolo === "ADMIN" ? "PENDING" : undefined
      }
    });

    if (user.ruolo === "ADMIN") {
      stats.presenzeInviateAD = await prisma.timbratura.count({
        where: {
          stato: "INVIATO_AD"
        }
      });
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Amministratore";
      case "GP":
        return "Gestore Presenze";
      case "DIPENDENTE":
        return "Dipendente";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Benvenuto, {user?.nome}
        </h1>
        <p className="text-gray-600 mt-1">
          Ruolo: {getRoleName(user?.ruolo || "")}
        </p>
      </div>

      {(user?.ruolo === "ADMIN" || user?.ruolo === "GP") && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dipendenti Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.dipendenti}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Timbrature Oggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.timbraturaOggi}</div>
            </CardContent>
          </Card>

          {user?.ruolo === "ADMIN" && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Giustificativi in Attesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.giustificativiPending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Presenze da Approvare
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.presenzeInviateAD}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {user?.ruolo === "DIPENDENTE" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Le Mie Presenze</CardTitle>
              <CardDescription>
                Visualizza e richiedi giustificativi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Consulta il calendario delle tue presenze e richiedi ferie o permessi.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Giustificativi</CardTitle>
              <CardDescription>
                Gestisci le tue richieste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Visualizza lo stato delle tue richieste di ferie, permessi ed ex festività.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Accessi Recenti</CardTitle>
          <CardDescription>
            Ultimi accessi al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Sistema di log degli accessi in fase di implementazione.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
