"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Employee {
  id: string;
  codiceFiscale: string;
  dataNascita: string;
  dataAssunzione: string;
  user: {
    id: string;
    nome: string;
    cognome: string;
    email: string;
    attivo: boolean;
  };
  template?: {
    lunediInizio?: string;
    lunediFine?: string;
    martediInizio?: string;
    martediFine?: string;
    mercolediInizio?: string;
    mercolediFine?: string;
    giovediInizio?: string;
    giovediFine?: string;
    venerdiInizio?: string;
    venerdiFine?: string;
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Gestione Dipendenti</h1>
        <p className="text-gray-600 mt-1">
          Visualizza e gestisci i dipendenti e i loro template orari
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dipendenti Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
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
              {employees.filter((e) => e.user.attivo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Con Template Orari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employees.filter((e) => e.template).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Dipendenti</CardTitle>
          <CardDescription>
            Tutti i dipendenti registrati nel sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dipendente</TableHead>
                <TableHead>Codice Fiscale</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data Assunzione</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.user.nome} {employee.user.cognome}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {employee.codiceFiscale}
                  </TableCell>
                  <TableCell>{employee.user.email}</TableCell>
                  <TableCell>
                    {new Date(employee.dataAssunzione).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    {employee.template ? (
                      <Badge variant="success">Configurato</Badge>
                    ) : (
                      <Badge variant="secondary">Non configurato</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.user.attivo ? (
                      <Badge variant="success">Attivo</Badge>
                    ) : (
                      <Badge variant="secondary">Disattivo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Nessun dipendente trovato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {employees.filter((e) => e.template).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Template Orari Configurati</CardTitle>
            <CardDescription>
              Orari standard settimanali per dipendente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees
                .filter((e) => e.template)
                .map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">
                      {employee.user.nome} {employee.user.cognome}
                    </h3>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {employee.template?.lunediInizio && (
                        <div>
                          <div className="font-medium text-gray-600">Lunedì</div>
                          <div>
                            {employee.template.lunediInizio} - {employee.template.lunediFine}
                          </div>
                        </div>
                      )}
                      {employee.template?.martediInizio && (
                        <div>
                          <div className="font-medium text-gray-600">Martedì</div>
                          <div>
                            {employee.template.martediInizio} - {employee.template.martediFine}
                          </div>
                        </div>
                      )}
                      {employee.template?.mercolediInizio && (
                        <div>
                          <div className="font-medium text-gray-600">Mercoledì</div>
                          <div>
                            {employee.template.mercolediInizio} - {employee.template.mercolediFine}
                          </div>
                        </div>
                      )}
                      {employee.template?.giovediInizio && (
                        <div>
                          <div className="font-medium text-gray-600">Giovedì</div>
                          <div>
                            {employee.template.giovediInizio} - {employee.template.giovediFine}
                          </div>
                        </div>
                      )}
                      {employee.template?.venerdiInizio && (
                        <div>
                          <div className="font-medium text-gray-600">Venerdì</div>
                          <div>
                            {employee.template.venerdiInizio} - {employee.template.venerdiFine}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
