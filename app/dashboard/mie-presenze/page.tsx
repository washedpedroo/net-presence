"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarioMensile } from "@/components/calendario-mensile";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Timbratura {
  id: string;
  data: string;
  entrata1?: string;
  uscita1?: string;
  entrata2?: string;
  uscita2?: string;
  oreLavorate: number;
  straordinari: number;
  note?: string;
  stato: string;
}

export default function MiePresenzePage() {
  const { data: session } = useSession();
  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [timbraturaMap, setTimbraturaMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.employeeId) {
      fetchTimbrature();
    }
  }, [session, anno, mese]);

  const fetchTimbrature = async () => {
    if (!session?.user?.employeeId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/timbrature?employeeId=${session.user.employeeId}&anno=${anno}&mese=${mese}`
      );
      const data = await res.json();
      setTimbrature(data);

      const map = new Map();
      data.forEach((t: Timbratura) => {
        const dataKey = t.data.split("T")[0];
        map.set(dataKey, t);
      });
      setTimbraturaMap(map);
    } catch (error) {
      console.error("Errore caricamento timbrature:", error);
    } finally {
      setLoading(false);
    }
  };

  const totaleOre = timbrature.reduce((acc, t) => acc + t.oreLavorate, 0);
  const totaleStraordinari = timbrature.reduce((acc, t) => acc + t.straordinari, 0);

  const selectedTimbratura = selectedDay
    ? timbraturaMap.get(selectedDay.toISOString().split("T")[0])
    : null;

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "APPROVATO":
        return <Badge variant="success">Approvato</Badge>;
      case "INVIATO_AD":
        return <Badge variant="info">Inviato AD</Badge>;
      case "CONFERMATO_GP":
        return <Badge variant="secondary">Confermato GP</Badge>;
      case "BOZZA":
        return <Badge variant="outline">Bozza</Badge>;
      default:
        return <Badge>{stato}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Le Mie Presenze</h1>
        <p className="text-gray-600 mt-1">
          Visualizza il tuo calendario di presenze e ore lavorate
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ore Totali Mese
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totaleOre.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Straordinari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {totaleStraordinari.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Giorni Lavorati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{timbrature.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <CalendarioMensile
            anno={anno}
            mese={mese}
            onMonthChange={(a, m) => {
              setAnno(a);
              setMese(m);
            }}
            onDaySelect={setSelectedDay}
            selectedDay={selectedDay}
            timbrature={timbraturaMap}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDay
                ? `Dettaglio ${selectedDay.toLocaleDateString("it-IT")}`
                : "Seleziona un giorno"}
            </CardTitle>
            <CardDescription>
              Visualizza i dettagli della timbratura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTimbratura ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedTimbratura.entrata1 && (
                    <>
                      <div>
                        <div className="font-medium text-gray-600">Entrata 1</div>
                        <div className="text-lg">{selectedTimbratura.entrata1}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Uscita 1</div>
                        <div className="text-lg">{selectedTimbratura.uscita1}</div>
                      </div>
                    </>
                  )}
                  {selectedTimbratura.entrata2 && (
                    <>
                      <div>
                        <div className="font-medium text-gray-600">Entrata 2</div>
                        <div className="text-lg">{selectedTimbratura.entrata2}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Uscita 2</div>
                        <div className="text-lg">{selectedTimbratura.uscita2}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ore Lavorate:</span>
                      <Badge variant="info">{selectedTimbratura.oreLavorate}h</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Straordinari:</span>
                      <Badge variant={selectedTimbratura.straordinari > 0 ? "warning" : "secondary"}>
                        {selectedTimbratura.straordinari}h
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stato:</span>
                      {getStatoBadge(selectedTimbratura.stato)}
                    </div>
                  </div>
                </div>

                {selectedTimbratura.note && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-600 mb-1">Note:</div>
                    <div className="text-sm text-gray-700">
                      {selectedTimbratura.note}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedDay ? (
              <div className="text-center text-gray-500 py-8">
                Nessuna timbratura registrata per questo giorno
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Seleziona un giorno dal calendario per vedere i dettagli
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Mensile</CardTitle>
          <CardDescription>
            Le tue ore lavorate nel mese di{" "}
            {new Date(anno, mese - 1).toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timbrature.length > 0 ? (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Totale Ore Lavorate:</span>
                  <span className="text-lg font-bold">{totaleOre.toFixed(2)} ore</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Totale Straordinari:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {totaleStraordinari.toFixed(2)} ore
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Media Ore/Giorno:</span>
                  <span className="text-lg">
                    {(totaleOre / timbrature.length).toFixed(2)} ore
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Giorni Lavorati:</span>
                  <span className="text-lg">{timbrature.length}</span>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Nessuna timbratura per questo mese
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
