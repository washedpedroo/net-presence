"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: string;
  attivo: boolean;
  createdAt: string;
  employee?: {
    id: string;
    codiceFiscale: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome: "",
    cognome: "",
    ruolo: "DIPENDENTE",
    codiceFiscale: "",
    dataNascita: "",
    luogoNascita: "",
    indirizzo: "",
    citta: "",
    cap: "",
    telefono: "",
    dataAssunzione: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Errore caricamento utenti:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Utente creato con successo!");
        setShowDialog(false);
        setFormData({
          email: "",
          password: "",
          nome: "",
          cognome: "",
          ruolo: "DIPENDENTE",
          codiceFiscale: "",
          dataNascita: "",
          luogoNascita: "",
          indirizzo: "",
          citta: "",
          cap: "",
          telefono: "",
          dataAssunzione: "",
        });
        fetchUsers();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore creazione utente:", error);
      alert("Errore durante la creazione dell'utente");
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (ruolo: string) => {
    switch (ruolo) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>;
      case "GP":
        return <Badge variant="info">GP</Badge>;
      case "DIPENDENTE":
        return <Badge variant="secondary">Dipendente</Badge>;
      default:
        return <Badge>{ruolo}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isDipendente = formData.ruolo === "DIPENDENTE";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-gray-600 mt-1">Amministra gli utenti del sistema</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utenti Registrati</CardTitle>
          <CardDescription>
            Totale: {users.length} utenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data Creazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.nome} {user.cognome}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.ruolo)}</TableCell>
                  <TableCell>
                    {user.attivo ? (
                      <Badge variant="success">Attivo</Badge>
                    ) : (
                      <Badge variant="secondary">Disattivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Utente</DialogTitle>
            <DialogDescription>
              Compila i campi per creare un nuovo utente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password * (min 12 caratteri)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={12}
              />
            </div>

            <div>
              <Label htmlFor="ruolo">Ruolo *</Label>
              <select
                id="ruolo"
                value={formData.ruolo}
                onChange={(e) => setFormData({ ...formData, ruolo: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="DIPENDENTE">Dipendente</option>
                <option value="GP">Gestore Presenze (GP)</option>
                <option value="ADMIN">Amministratore</option>
              </select>
            </div>

            {isDipendente && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Dati Anagrafici Dipendente</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
                      <Input
                        id="codiceFiscale"
                        value={formData.codiceFiscale}
                        onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                        required
                        maxLength={16}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dataNascita">Data di Nascita *</Label>
                        <Input
                          id="dataNascita"
                          type="date"
                          value={formData.dataNascita}
                          onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="luogoNascita">Luogo di Nascita *</Label>
                        <Input
                          id="luogoNascita"
                          value={formData.luogoNascita}
                          onChange={(e) => setFormData({ ...formData, luogoNascita: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="indirizzo">Indirizzo *</Label>
                      <Input
                        id="indirizzo"
                        value={formData.indirizzo}
                        onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="citta">Città *</Label>
                        <Input
                          id="citta"
                          value={formData.citta}
                          onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cap">CAP *</Label>
                        <Input
                          id="cap"
                          value={formData.cap}
                          onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                          required
                          maxLength={5}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefono">Telefono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataAssunzione">Data Assunzione *</Label>
                        <Input
                          id="dataAssunzione"
                          type="date"
                          value={formData.dataAssunzione}
                          onChange={(e) => setFormData({ ...formData, dataAssunzione: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

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
                    Creazione...
                  </>
                ) : (
                  "Crea Utente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
