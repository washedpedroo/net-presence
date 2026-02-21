"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarioMensile } from "@/components/calendario-mensile";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Check, Send, Calendar, Lock, Unlock } from "lucide-react";

interface Employee {
  id: string;
  user: {
    nome: string;
    cognome: string;
  };
}

interface Timbratura {
  id: string;
  data: string;
  entrata1?: string;
  uscita1?: string;
  entrata2?: string;
  uscita2?: string;
  oreLavorate: number;
  straordinari: number;
  stato: string;
  bloccato: boolean;
}

const toLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function TimbratarePage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [timbraturaMap, setTimbraturaMap] = useState<Map<string, any>>(new Map());
  const [isMeseBlocato, setIsMeseBlocato] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDay, setSavedDay] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    entrata1: "",
    uscita1: "",
    entrata2: "",
    uscita2: "",
  });
  const [calcoloOre, setCalcoloOre] = useState<{
    oreLavorate: number;
    straordinari: number;
    errori: string[];
  } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchTimbrature();
    }
  }, [selectedEmployee, anno, mese]);

  useEffect(() => {
    if (selectedDay && selectedEmployee) {
      loadTimbraturaForDay();
    }
  }, [selectedDay]);

  useEffect(() => {
    // Calcola ore quando cambiano i campi
    if (formData.entrata1 || formData.uscita1 || formData.entrata2 || formData.uscita2) {
      calcolaOre();
    }
  }, [formData.entrata1, formData.uscita1, formData.entrata2, formData.uscita2]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error) {
      console.error("Errore caricamento dipendenti:", error);
    }
  };

  const fetchTimbrature = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `/api/timbrature?employeeId=${selectedEmployee}&anno=${anno}&mese=${mese}`
      );
      const data = await res.json();
      setTimbrature(data);

      // Crea mappa per calendario
      const map = new Map();
      data.forEach((t: Timbratura) => {
        const dataKey = t.data.split("T")[0];
        map.set(dataKey, t);
      });
      setTimbraturaMap(map);
      setIsMeseBlocato(data.some((t: Timbratura) => t.bloccato));
    } catch (error) {
      console.error("Errore caricamento timbrature:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimbraturaForDay = () => {
    if (!selectedDay) return;

    const dataKey = toLocalDateKey(selectedDay);
    const timbratura = timbraturaMap.get(dataKey);

    if (timbratura) {
      setFormData({
        entrata1: timbratura.entrata1 || "",
        uscita1: timbratura.uscita1 || "",
        entrata2: timbratura.entrata2 || "",
        uscita2: timbratura.uscita2 || "",
      });
    } else {
      setFormData({
        entrata1: "",
        uscita1: "",
        entrata2: "",
        uscita2: "",
      });
    }
    setCalcoloOre(null);
  };

  const calcolaOre = () => {
    // Simulazione calcolo (in produzione usa la funzione da lib/utils.ts)
    const { entrata1, uscita1, entrata2, uscita2 } = formData;
    
    let minuti = 0;
    const errori: string[] = [];

    if (entrata1 && uscita1) {
      const [h1, m1] = entrata1.split(":").map(Number);
      const [h2, m2] = uscita1.split(":").map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff <= 0) {
        errori.push("Slot 1: uscita deve essere dopo entrata");
      } else {
        minuti += diff;
      }
    }

    if (entrata2 && uscita2) {
      const [h1, m1] = entrata2.split(":").map(Number);
      const [h2, m2] = uscita2.split(":").map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff <= 0) {
        errori.push("Slot 2: uscita deve essere dopo entrata");
      } else {
        minuti += diff;
      }
    }

    const oreLavorate = minuti / 60;
    const straordinari = Math.max(0, (minuti - (8 * 60) - 10) / 60);

    setCalcoloOre({
      oreLavorate: Math.round(oreLavorate * 100) / 100,
      straordinari: Math.round(straordinari * 100) / 100,
      errori,
    });
  };

  const handleSave = async () => {
    if (!selectedDay || !selectedEmployee) {
      alert("Seleziona data e dipendente");
      return;
    }

    if (calcoloOre && calcoloOre.errori.length > 0) {
      alert("Correggi gli errori prima di salvare:\n" + calcoloOre.errori.join("\n"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/timbrature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          data: toLocalDateKey(selectedDay),
          ...formData,
        }),
      });

      if (res.ok) {
        alert("Timbratura salvata con successo!");
        const key = toLocalDateKey(selectedDay);
        setSavedDay(key);
        setTimeout(() => setSavedDay(null), 2000);
        fetchTimbrature();
        setFormData({
          entrata1: "",
          uscita1: "",
          entrata2: "",
          uscita2: "",
        });
        setSelectedDay(null);
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleConferma = async () => {
    if (!selectedEmployee || !confirm("Confermare le timbrature per questo dipendente?")) {
      return;
    }

    try {
      const res = await fetch("/api/timbrature/conferma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          anno,
          mese,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchTimbrature();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore conferma:", error);
    }
  };

  const handleCaricaTemplate = async () => {
    if (!selectedDay || !selectedEmployee) {
      alert("Seleziona un dipendente e un giorno prima di caricare il template");
      return;
    }

    try {
      const res = await fetch(`/api/templates?employeeId=${selectedEmployee}`);
      if (!res.ok) {
        alert("Template non trovato per questo dipendente");
        return;
      }
      const tmpl = await res.json();
      if (!tmpl || Object.keys(tmpl).length === 0) {
        alert("Nessun template configurato per questo dipendente");
        return;
      }

      const GIORNO_MAP: Record<number, string> = {
        1: "lunedi",
        2: "martedi",
        3: "mercoledi",
        4: "giovedi",
        5: "venerdi",
      };

      const dayOfWeek = selectedDay.getDay(); // 0=dom, 1=lun, ...
      const giornoKey = GIORNO_MAP[dayOfWeek];
      if (!giornoKey) {
        alert("Il giorno selezionato è un weekend, il template non si applica");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        entrata1: tmpl[`${giornoKey}Entrata1`] ?? "",
        uscita1: tmpl[`${giornoKey}Uscita1`] ?? "",
        entrata2: tmpl[`${giornoKey}Entrata2`] ?? "",
        uscita2: tmpl[`${giornoKey}Uscita2`] ?? "",
      }));
    } catch {
      alert("Errore durante il caricamento del template");
    }
  };

  const handleInvia = async () => {
    if (!confirm("Inviare tutte le presenze all'AD per approvazione?")) {
      return;
    }

    try {
      const res = await fetch("/api/timbrature/invia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anno, mese }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchTimbrature();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore invio:", error);
    }
  };

  const handleBlocca = async () => {
    if (!selectedEmployee || !confirm("Confermare e bloccare le timbrature per questo dipendente? Non potranno più essere modificate.")) {
      return;
    }

    try {
      const res = await fetch("/api/timbrature/blocca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee, anno, mese }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchTimbrature();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore blocco timbrature:", error);
    }
  };

  const handleSblocca = async () => {
    if (!selectedEmployee || !confirm("Sbloccare le timbrature per questo dipendente?")) {
      return;
    }

    try {
      const res = await fetch("/api/timbrature/sblocca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee, anno, mese }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchTimbrature();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore sblocco timbrature:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestione Timbrature</h1>
        <p className="text-gray-600 mt-1">
          Inserisci e gestisci le timbrature dei dipendenti
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleziona Dipendente</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.user.nome} {emp.user.cognome}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
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
              savedDay={savedDay}
            />
          )}

          <div className="mt-4 flex gap-2 flex-wrap items-center">
            {/* GP: bottoni esistenti, nascosti se il mese è bloccato */}
            {userRole === "GP" && !isMeseBlocato && (
              <>
                <Button onClick={handleConferma} variant="outline">
                  <Check className="mr-2 h-4 w-4" />
                  Conferma Dipendente
                </Button>
                <Button onClick={handleInvia}>
                  <Send className="mr-2 h-4 w-4" />
                  Invia all'AD
                </Button>
              </>
            )}

            {/* AD: Conferma le timbrature oppure badge bloccato */}
            {userRole === "AD" && !isMeseBlocato && (
              <Button onClick={handleBlocca}>
                <Lock className="mr-2 h-4 w-4" />
                Conferma le timbrature
              </Button>
            )}
            {userRole === "AD" && isMeseBlocato && (
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Lock className="mr-1 h-3 w-3" />
                Timbrature confermate
              </Badge>
            )}

            {/* ADMIN: bottoni GP + Sblocca se bloccato */}
            {userRole === "ADMIN" && (
              <>
                <Button onClick={handleConferma} variant="outline">
                  <Check className="mr-2 h-4 w-4" />
                  Conferma Dipendente
                </Button>
                <Button onClick={handleInvia}>
                  <Send className="mr-2 h-4 w-4" />
                  Invia all'AD
                </Button>
                {isMeseBlocato && (
                  <Button onClick={handleSblocca} variant="destructive">
                    <Unlock className="mr-2 h-4 w-4" />
                    Sblocca timbrature
                  </Button>
                )}
              </>
            )}

            {/* Messaggio bloccato visibile a GP quando il mese è bloccato */}
            {userRole === "GP" && isMeseBlocato && (
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Lock className="mr-1 h-3 w-3" />
                Timbrature confermate dall'AD
              </Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDay
                ? `Timbratura ${selectedDay.toLocaleDateString("it-IT")}`
                : "Seleziona un giorno"}
            </CardTitle>
            <CardDescription>
              Inserisci gli orari di entrata e uscita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDay ? (
              <>
                {isMeseBlocato && userRole !== "ADMIN" && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    Timbrature bloccate dall&apos;AD. Contatta un amministratore per modificarle.
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCaricaTemplate}
                  disabled={isMeseBlocato && userRole !== "ADMIN"}
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Carica Orari da Template
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entrata1">Entrata 1</Label>
                    <Input
                      id="entrata1"
                      type="time"
                      value={formData.entrata1}
                      disabled={isMeseBlocato && userRole !== "ADMIN"}
                      onChange={(e) =>
                        setFormData({ ...formData, entrata1: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="uscita1">Uscita 1</Label>
                    <Input
                      id="uscita1"
                      type="time"
                      value={formData.uscita1}
                      disabled={isMeseBlocato && userRole !== "ADMIN"}
                      onChange={(e) =>
                        setFormData({ ...formData, uscita1: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entrata2">Entrata 2</Label>
                    <Input
                      id="entrata2"
                      type="time"
                      value={formData.entrata2}
                      disabled={isMeseBlocato && userRole !== "ADMIN"}
                      onChange={(e) =>
                        setFormData({ ...formData, entrata2: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="uscita2">Uscita 2</Label>
                    <Input
                      id="uscita2"
                      type="time"
                      value={formData.uscita2}
                      disabled={isMeseBlocato && userRole !== "ADMIN"}
                      onChange={(e) =>
                        setFormData({ ...formData, uscita2: e.target.value })
                      }
                    />
                  </div>
                </div>

                {calcoloOre && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-semibold mb-2">Riepilogo</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Ore Lavorate:</span>
                        <Badge variant="info">{calcoloOre.oreLavorate}h</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Straordinari:</span>
                        <Badge variant={calcoloOre.straordinari > 0 ? "warning" : "secondary"}>
                          {calcoloOre.straordinari}h
                        </Badge>
                      </div>
                      {calcoloOre.errori.length > 0 && (
                        <div className="mt-2 text-red-600 text-xs">
                          {calcoloOre.errori.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving || (isMeseBlocato && userRole !== "ADMIN")}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salva Timbratura
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Seleziona un giorno dal calendario per inserire la timbratura
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
