"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, CheckCircle, Users } from "lucide-react";

interface Employee {
  id: string;
  user: { nome: string; cognome: string };
}

const GIORNI = [
  { key: "lunedi", label: "Lunedì" },
  { key: "martedi", label: "Martedì" },
  { key: "mercoledi", label: "Mercoledì" },
  { key: "giovedi", label: "Giovedì" },
  { key: "venerdi", label: "Venerdì" },
] as const;

type GiornoKey = (typeof GIORNI)[number]["key"];

type TemplateData = Partial<
  Record<`${GiornoKey}Entrata1` | `${GiornoKey}Uscita1` | `${GiornoKey}Entrata2` | `${GiornoKey}Uscita2`, string>
>;

const emptyTemplate = (): TemplateData => {
  const t: TemplateData = {};
  for (const { key } of GIORNI) {
    t[`${key}Entrata1`] = "";
    t[`${key}Uscita1`] = "";
    t[`${key}Entrata2`] = "";
    t[`${key}Uscita2`] = "";
  }
  return t;
};

export default function TemplatePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [template, setTemplate] = useState<TemplateData>(emptyTemplate());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) fetchTemplate(selectedEmployee);
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
      if (data.length > 0) setSelectedEmployee(data[0].id);
    } catch {
      setError("Errore caricamento dipendenti");
    }
  };

  const fetchTemplate = async (empId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/templates?employeeId=${empId}`);
      const data = await res.json();
      const merged = emptyTemplate();
      for (const key of Object.keys(merged) as (keyof TemplateData)[]) {
        merged[key] = data[key] ?? "";
      }
      setTemplate(merged);
    } catch {
      setError("Errore caricamento template");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (applyToAll = false) => {
    applyToAll ? setApplyingAll(true) : setSaving(true);
    setError("");
    setSaved(false);
    try {
      const body = applyToAll
        ? { ...template, applyToAll: true, employeeId: selectedEmployee }
        : { ...template, employeeId: selectedEmployee };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Errore nel salvataggio");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setSaving(false);
      setApplyingAll(false);
    }
  };

  const setSlot = (giorno: GiornoKey, slot: "Entrata1" | "Uscita1" | "Entrata2" | "Uscita2", value: string) => {
    setTemplate((prev) => ({ ...prev, [`${giorno}${slot}`]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Template Orari</h1>
        <p className="text-gray-600 mt-1">
          Configura l&apos;orario settimanale standard per ogni dipendente
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

      <Card>
        <CardHeader>
          <CardTitle>Orario Settimanale</CardTitle>
          <CardDescription>
            Slot mattina (Entrata 1 / Uscita 1) e pomeriggio (Entrata 2 / Uscita 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-gray-600 py-2 pr-4 min-w-[100px]">Giorno</th>
                    <th className="text-center font-medium text-gray-600 py-2 px-2">Entrata 1</th>
                    <th className="text-center font-medium text-gray-600 py-2 px-2">Uscita 1</th>
                    <th className="text-center font-medium text-gray-600 py-2 px-2">Entrata 2</th>
                    <th className="text-center font-medium text-gray-600 py-2 px-2">Uscita 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {GIORNI.map(({ key, label }) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <Label className="font-medium">{label}</Label>
                      </td>
                      {(["Entrata1", "Uscita1", "Entrata2", "Uscita2"] as const).map((slot) => (
                        <td key={slot} className="py-3 px-2">
                          <Input
                            type="time"
                            value={template[`${key}${slot}`] ?? ""}
                            onChange={(e) => setSlot(key, slot, e.target.value)}
                            className="w-32"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {saved && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="h-4 w-4" />
              Template salvato con successo!
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={() => handleSave(false)} disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salva Template
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={applyingAll || loading}
            >
              {applyingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applicazione...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Applica a Tutti
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
