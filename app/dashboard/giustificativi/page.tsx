"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Check, X } from "lucide-react";

interface Giustificativo {
  id: string;
  tipo: string;
  dataInizio: string;
  dataFine?: string;
  oraInizio?: string;
  oraFine?: string;
  oreTotali: number;
  descrizione?: string;
  stato: string;
  richiestoAt: string;
  motivazioneRigetto?: string;
  employee: {
    user: {
      nome: string;
      cognome: string;
    };
  };
  timeline: any[];
}

export default function GiustificativiPage() {
  const [giustificativi, setGiustificativi] = useState<Giustificativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedGiustificativo, setSelectedGiustificativo] = useState<Giustificativo | null>(null);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [motivazione, setMotivazione] = useState("");
  const [formData, setFormData] = useState({
    tipo: "PERMESSO",
    dataInizio: "",
    dataFine: "",
    oraInizio: "",
    oraFine: "",
    descrizione: "",
  });

  useEffect(() => {
    fetchGiustificativi();
  }, []);

  const fetchGiustificativi = async () => {
    try {
      const res = await fetch("/api/giustificativi");
      const data = await res.json();
      setGiustificativi(data);
    } catch (error) {
      console.error("Errore caricamento giustificativi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/giustificativi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Giustificativo richiesto con successo!");
        setShowDialog(false);
        setFormData({
          tipo: "PERMESSO",
          dataInizio: "",
          dataFine: "",
          oraInizio: "",
          oraFine: "",
          descrizione: "",
        });
        fetchGiustificativi();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore creazione giustificativo:", error);
      alert("Errore durante la creazione");
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (azione: "APPROVA" | "RIGETTA") => {
    if (!selectedGiustificativo) return;

    if (azione === "RIGETTA" && !motivazione) {
      alert("La motivazione è obbligatoria per il rigetto");
      return;
    }

    setApproving(true);
    try {
      const res = await fetch("/api/giustificativi/approva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giustificativoId: selectedGiustificativo.id,
          azione,
          motivazione: azione === "RIGETTA" ? motivazione : undefined,
        }),
      });

      if (res.ok) {
        alert(`Giustificativo ${azione === "APPROVA" ? "approvato" : "rigettato"} con successo!`);
        setShowApproveDialog(false);
        setSelectedGiustificativo(null);
        setMotivazione("");
        fetchGiustificativi();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore approvazione:", error);
      alert("Errore durante l'approvazione");
    } finally {
      setApproving(false);
    }
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "APPROVATO":
        return <Badge variant="success">Approvato</Badge>;
      case "RIFIUTATO":
        return <Badge variant="destructive">Rifiutato</Badge>;
      case "PENDING":
        return <Badge variant="warning">In Attesa</Badge>;
      default:
        return <Badge>{stato}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "FERIE":
        return <Badge variant="info">Ferie</Badge>;
      case "PERMESSO":
        return <Badge variant="secondary">Permesso</Badge>;
      case "EX_FESTIVITA":
        return <Badge variant="outline">Ex Festività</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pending = giustificativi.filter((g) => g.stato === "PENDING");
  const approvati = giustificativi.filter((g) => g.stato === "APPROVATO");
  const rifiutati = giustificativi.filter((g) => g.stato === "RIFIUTATO");

  const isFerie = formData.tipo === "FERIE";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Giustificativi</h1>
          <p className="text-gray-600 mt-1">
            Gestisci ferie, permessi ed ex festività
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Richiesta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Attesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pending.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approvati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvati.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rifiutati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rifiutati.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Richieste</CardTitle>
          <CardDescription>
            Tutte le richieste di giustificativi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dipendente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Periodo/Orario</TableHead>
                <TableHead>Ore</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data Richiesta</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giustificativi.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    {g.employee.user.nome} {g.employee.user.cognome}
                  </TableCell>
                  <TableCell>{getTipoBadge(g.tipo)}</TableCell>
                  <TableCell>
                    {g.tipo === "FERIE" ? (
                      <>
                        {new Date(g.dataInizio).toLocaleDateString("it-IT")} -{" "}
                        {new Date(g.dataFine!).toLocaleDateString("it-IT")}
                      </>
                    ) : (
                      <>
                        {new Date(g.dataInizio).toLocaleDateString("it-IT")}
                        <br />
                        <span className="text-sm text-gray-500">
                          {g.oraInizio} - {g.oraFine}
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell>{g.oreTotali}h</TableCell>
                  <TableCell>{getStatoBadge(g.stato)}</TableCell>
                  <TableCell>
                    {new Date(g.richiestoAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    {g.stato === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGiustificativo(g);
                          setShowApproveDialog(true);
                        }}
                      >
                        Gestisci
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {giustificativi.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Nessun giustificativo trovato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nuova Richiesta */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Giustificativo</DialogTitle>
            <DialogDescription>
              Compila i campi per richiedere ferie o permessi
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="PERMESSO">Permesso</option>
                <option value="FERIE">Ferie</option>
                <option value="EX_FESTIVITA">Ex Festività</option>
              </select>
            </div>

            {isFerie ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInizio">Data Inizio *</Label>
                  <Input
                    id="dataInizio"
                    type="date"
                    value={formData.dataInizio}
                    onChange={(e) =>
                      setFormData({ ...formData, dataInizio: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataFine">Data Fine *</Label>
                  <Input
                    id="dataFine"
                    type="date"
                    value={formData.dataFine}
                    onChange={(e) =>
                      setFormData({ ...formData, dataFine: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="dataInizio">Data *</Label>
                  <Input
                    id="dataInizio"
                    type="date"
                    value={formData.dataInizio}
                    onChange={(e) =>
                      setFormData({ ...formData, dataInizio: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="oraInizio">Ora Inizio *</Label>
                    <Input
                      id="oraInizio"
                      type="time"
                      value={formData.oraInizio}
                      onChange={(e) =>
                        setFormData({ ...formData, oraInizio: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="oraFine">Ora Fine *</Label>
                    <Input
                      id="oraFine"
                      type="time"
                      value={formData.oraFine}
                      onChange={(e) =>
                        setFormData({ ...formData, oraFine: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea
                id="descrizione"
                value={formData.descrizione}
                onChange={(e) =>
                  setFormData({ ...formData, descrizione: e.target.value })
                }
                placeholder="Motivazione o note aggiuntive..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={creating}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio...
                  </>
                ) : (
                  "Invia Richiesta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Approvazione */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestisci Giustificativo</DialogTitle>
            <DialogDescription>
              Approva o rigetta la richiesta
            </DialogDescription>
          </DialogHeader>

          {selectedGiustificativo && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Dipendente: </span>
                    {selectedGiustificativo.employee.user.nome}{" "}
                    {selectedGiustificativo.employee.user.cognome}
                  </div>
                  <div>
                    <span className="font-medium">Tipo: </span>
                    {getTipoBadge(selectedGiustificativo.tipo)}
                  </div>
                  <div>
                    <span className="font-medium">Periodo: </span>
                    {selectedGiustificativo.tipo === "FERIE" ? (
                      <>
                        {new Date(
                          selectedGiustificativo.dataInizio
                        ).toLocaleDateString("it-IT")}{" "}
                        -{" "}
                        {new Date(
                          selectedGiustificativo.dataFine!
                        ).toLocaleDateString("it-IT")}
                      </>
                    ) : (
                      <>
                        {new Date(
                          selectedGiustificativo.dataInizio
                        ).toLocaleDateString("it-IT")}{" "}
                        {selectedGiustificativo.oraInizio} -{" "}
                        {selectedGiustificativo.oraFine}
                      </>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Ore Totali: </span>
                    {selectedGiustificativo.oreTotali}h
                  </div>
                  {selectedGiustificativo.descrizione && (
                    <div>
                      <span className="font-medium">Descrizione: </span>
                      {selectedGiustificativo.descrizione}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="motivazione">
                  Motivazione (obbligatoria per rigetto)
                </Label>
                <Textarea
                  id="motivazione"
                  value={motivazione}
                  onChange={(e) => setMotivazione(e.target.value)}
                  placeholder="Scrivi la motivazione..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => handleApprove("RIGETTA")}
                  disabled={approving}
                >
                  {approving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Rigetta
                </Button>
                <Button
                  onClick={() => handleApprove("APPROVA")}
                  disabled={approving}
                >
                  {approving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approva
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
