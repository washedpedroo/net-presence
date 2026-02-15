"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText } from "lucide-react";

interface Employee {
  id: string;
  user: {
    nome: string;
    cognome: string;
  };
}

interface RecapDipendente {
  employeeId: string;
  dipendente: string;
  oreLavorate: number;
  straordinari: number;
  giorniLavorati: number;
}

export default function ReportPage() {
  const oggi = new Date();
  const [anno, setAnno] = useState(oggi.getFullYear());
  const [mese, setMese] = useState(oggi.getMonth() + 1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recap, setRecap] = useState<RecapDipendente[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error("Errore caricamento dipendenti:", error);
    }
  };

  const generaReport = async () => {
    setLoading(true);
    const recapData: RecapDipendente[] = [];

    try {
      for (const emp of employees) {
        const res = await fetch(
          `/api/timbrature?employeeId=${emp.id}&anno=${anno}&mese=${mese}`
        );
        const timbrature = await res.json();

        const oreLavorate = timbrature.reduce(
          (acc: number, t: any) => acc + t.oreLavorate,
          0
        );
        const straordinari = timbrature.reduce(
          (acc: number, t: any) => acc + t.straordinari,
          0
        );

        recapData.push({
          employeeId: emp.id,
          dipendente: `${emp.user.nome} ${emp.user.cognome}`,
          oreLavorate,
          straordinari,
          giorniLavorati: timbrature.length,
        });
      }

      setRecap(recapData);
    } catch (error) {
      console.error("Errore generazione report:", error);
      alert("Errore nella generazione del report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (employeeId: string, nomeDipendente: string) => {
    setDownloadingId(employeeId);
    try {
      const res = await fetch(
        `/api/reports/pdf?employeeId=${employeeId}&anno=${anno}&mese=${mese}`
      );
      if (!res.ok) {
        const err = await res.json();
        alert(`Errore: ${err.error}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presenze_${nomeDipendente.replace(" ", "_").toLowerCase()}_${anno}_${mese.toString().padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Errore durante il download del PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const totaleOre = recap.reduce((acc, r) => acc + r.oreLavorate, 0);
  const totaleStraordinari = recap.reduce((acc, r) => acc + r.straordinari, 0);

  const mesiNomi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Presenze</h1>
        <p className="text-gray-600 mt-1">
          Genera report mensili e statistiche aggregate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleziona Periodo</CardTitle>
          <CardDescription>
            Scegli mese e anno per generare il report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Mese</label>
              <select
                value={mese}
                onChange={(e) => setMese(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                {mesiNomi.map((nome, idx) => (
                  <option key={idx} value={idx + 1}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Anno</label>
              <select
                value={anno}
                onChange={(e) => setAnno(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
            <Button onClick={generaReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generazione...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Genera Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recap.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Totale Ore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totaleOre.toFixed(1)}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Totale Straordinari
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
                  Dipendenti Attivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {recap.filter((r) => r.giorniLavorati > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Report {mesiNomi[mese - 1]} {anno}
                  </CardTitle>
                  <CardDescription>
                    Riepilogo presenze per dipendente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead className="text-right">Giorni Lavorati</TableHead>
                    <TableHead className="text-right">Ore Lavorate</TableHead>
                    <TableHead className="text-right">Straordinari</TableHead>
                    <TableHead className="text-right">Media Ore/Giorno</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recap.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.dipendente}</TableCell>
                      <TableCell className="text-right">
                        {r.giorniLavorati}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="info">{r.oreLavorate.toFixed(1)}h</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.straordinari > 0 ? "warning" : "secondary"}>
                          {r.straordinari.toFixed(1)}h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.giorniLavorati > 0
                          ? (r.oreLavorate / r.giorniLavorati).toFixed(2)
                          : "0.00"}
                        h
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(r.employeeId, r.dipendente)}
                          disabled={downloadingId === r.employeeId}
                        >
                          {downloadingId === r.employeeId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recap.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nessun dato disponibile
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analisi Statistiche</CardTitle>
              <CardDescription>Insights sul periodo selezionato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Media Ore per Dipendente
                  </div>
                  <div className="text-2xl font-bold">
                    {recap.length > 0
                      ? (totaleOre / recap.length).toFixed(2)
                      : "0.00"}
                    h
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Media Straordinari
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {recap.length > 0
                      ? (totaleStraordinari / recap.length).toFixed(2)
                      : "0.00"}
                    h
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Dipendente Top Ore
                  </div>
                  <div className="text-lg font-bold">
                    {recap.length > 0
                      ? recap.reduce((prev, curr) =>
                          curr.oreLavorate > prev.oreLavorate ? curr : prev
                        ).dipendente
                      : "-"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {recap.length > 0
                      ? recap
                          .reduce((prev, curr) =>
                            curr.oreLavorate > prev.oreLavorate ? curr : prev
                          )
                          .oreLavorate.toFixed(1)
                      : "0"}
                    h
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Tasso di Presenza
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {recap.length > 0
                      ? (
                          (recap.reduce((acc, r) => acc + r.giorniLavorati, 0) /
                            (recap.length * 22)) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="text-sm text-gray-500">
                    (su 22 giorni lavorativi medi)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
