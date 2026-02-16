"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Trash2, PencilLine } from "lucide-react";

interface User {
  id: string;
  username: string;
  nome: string;
  cognome: string;
  ruolo: string;
  attivo: boolean;
  createdAt: string;
}

const RUOLI = [
  { value: "DIPENDENTE", label: "Dipendente" },
  { value: "GP", label: "Gestore Presenze (GP)" },
  { value: "AD", label: "Amministratore Delegato (AD)" },
  { value: "ADMIN", label: "Amministratore" },
] as const;

const EMPTY_FORM = {
  password: "",
  nome: "",
  cognome: "",
  ruolo: "DIPENDENTE",
  dataNascita: "",
  luogoNascita: "",
  indirizzo: "",
  citta: "",
  cap: "",
  telefono: "",
  dataAssunzione: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRuolo, setNewRuolo] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
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
        setShowCreateDialog(false);
        setFormData({ ...EMPTY_FORM });
        fetchUsers();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch {
      alert("Errore durante la creazione dell'utente");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRoleDialog = (user: User) => {
    setEditingUser(user);
    setNewRuolo(user.ruolo);
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruolo: newRuolo }),
      });

      if (res.ok) {
        setShowRoleDialog(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Errore: ${err.error}`);
      }
    } catch {
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAttivo = async (user: User) => {
    const azione = user.attivo ? "disattivare" : "riattivare";
    if (!confirm(`Vuoi ${azione} l'utente ${user.nome} ${user.cognome}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attivo: !user.attivo }),
      });
      if (res.ok) fetchUsers();
      else alert("Errore nell'aggiornamento dello stato");
    } catch {
      alert("Errore di rete");
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Eliminare definitivamente l'utente ${user.nome} ${user.cognome}?\nQuesta azione non può essere annullata.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Errore: ${err.error}`);
      }
    } catch {
      alert("Errore durante l'eliminazione");
    }
  };

  const getRoleBadge = (ruolo: string) => {
    switch (ruolo) {
      case "ADMIN": return <Badge variant="destructive">Admin</Badge>;
      case "AD": return <Badge variant="warning">AD</Badge>;
      case "GP": return <Badge variant="info">GP</Badge>;
      case "DIPENDENTE": return <Badge variant="secondary">Dipendente</Badge>;
      default: return <Badge>{ruolo}</Badge>;
    }
  };

  const isDipendente = formData.ruolo === "DIPENDENTE";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Utenti</h1>
          <p className="text-gray-600 mt-1">Amministra gli utenti del sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utenti Registrati</CardTitle>
          <CardDescription>Totale: {users.length} utenti</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data Creazione</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.nome} {user.cognome}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.username}</TableCell>
                  <TableCell>{getRoleBadge(user.ruolo)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleAttivo(user)}
                      className="cursor-pointer"
                      title={user.attivo ? "Clicca per disattivare" : "Clicca per riattivare"}
                    >
                      {user.attivo ? (
                        <Badge variant="success">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary">Disattivo</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleDialog(user)}
                        title="Cambia ruolo"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        title="Elimina utente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog crea nuovo utente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Utente</DialogTitle>
            <DialogDescription>Compila i campi per creare un nuovo utente</DialogDescription>
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

            {formData.nome && formData.cognome && (
              <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Username generato automaticamente:{" "}
                <span className="font-mono font-semibold">
                  {formData.nome.toLowerCase().replace(/\s+/g, "")}.{formData.cognome.toLowerCase().replace(/\s+/g, "")}
                </span>
              </div>
            )}

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
                {RUOLI.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {isDipendente && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4">Dati Anagrafici Dipendente</h3>

                <div className="space-y-4">
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
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
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

      {/* Dialog cambio ruolo */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambia Ruolo</DialogTitle>
            <DialogDescription>
              {editingUser?.nome} {editingUser?.cognome} — {editingUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="nuovoRuolo">Nuovo Ruolo</Label>
            <select
              id="nuovoRuolo"
              value={newRuolo}
              onChange={(e) => setNewRuolo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
            >
              {RUOLI.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleSaveRole} disabled={saving || newRuolo === editingUser?.ruolo}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Ruolo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
