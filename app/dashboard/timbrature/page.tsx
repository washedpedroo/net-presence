"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarioMensile } from "@/components/calendario-mensile";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Check, Send } from "lucide-react";

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
  note?: string;
  stato: string;
}

export default function TimbratarePage() {
  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [timbraturaMap, setTimbraturaMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    entrata1: "",
    uscita1: "",
    entrata2: "",
    uscita2: "",
    note: "",
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
    } catch (error) {
      console.error("Errore caricamento timbrature:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimbraturaForDay = () => {
    if (!selectedDay) return;

    const dataKey = selectedDay.toISOString().split("T")[0];
    const timbratura = timbraturaMap.get(dataKey);

    if (timbratura) {
      setFormData({
        entrata1: timbratura.entrata1 || "",
        uscita1: timbratura.uscita1 || "",
        entrata2: timbratura.entrata2 || "",
        uscita2: timbratura.uscita2 || "",
        note: timbratura.note || "",
      });
    } else {
      setFormData({
        entrata1: "",
        uscita1: "",
        entrata2: "",
        uscita2: "",
        note: "",
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
    if (!selectedDay || !selectedEmployee || !formData.note) {
      alert("Compila tutti i campi obbligatori (data, dipendente, note)");
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
          data: selectedDay.toISOString().split("T")[0],
          ...formData,
        }),
      });

      if (res.ok) {
        alert("Timbratura salvata con successo!");
        fetchTimbrature();
        setFormData({
          entrata1: "",
          uscita1: "",
          entrata2: "",
          uscita2: "",
          note: "",
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
            />
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={handleConferma} variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Conferma Dipendente
            </Button>
            <Button onClick={handleInvia}>
              <Send className="mr-2 h-4 w-4" />
              Invia all'AD
            </Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entrata1">Entrata 1</Label>
                    <Input
                      id="entrata1"
                      type="time"
                      value={formData.entrata1}
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
                      onChange={(e) =>
                        setFormData({ ...formData, uscita2: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="note">Note * (obbligatorio)</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    placeholder="Es: Lavoro in ufficio, smart working, ecc."
                    rows={3}
                  />
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
                  disabled={saving || !formData.note}
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
