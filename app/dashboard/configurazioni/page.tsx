"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, CheckCircle } from "lucide-react";

export default function ConfigurazioniPage() {
  const [config, setConfig] = useState({
    ORE_STANDARD: "8",
    TOLLERANZA_MINUTI: "10",
    SESSION_TIMEOUT_ORE: "8",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/configurazioni");
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({
          ORE_STANDARD: data.ORE_STANDARD ?? prev.ORE_STANDARD,
          TOLLERANZA_MINUTI: data.TOLLERANZA_MINUTI ?? prev.TOLLERANZA_MINUTI,
          SESSION_TIMEOUT_ORE: data.SESSION_TIMEOUT_ORE ?? prev.SESSION_TIMEOUT_ORE,
        }));
      }
    } catch {
      setError("Errore nel caricamento delle configurazioni");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/configurazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
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
        <h1 className="text-3xl font-bold">Configurazioni Sistema</h1>
        <p className="text-gray-600 mt-1">
          Gestisci le impostazioni globali del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Parametri Generali
          </CardTitle>
          <CardDescription>
            Configura i parametri di base per il calcolo delle presenze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="oreStandard">Ore Standard Giornaliere</Label>
            <Input
              id="oreStandard"
              type="number"
              min="1"
              max="24"
              value={config.ORE_STANDARD}
              onChange={(e) =>
                setConfig({ ...config, ORE_STANDARD: e.target.value })
              }
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-1">
              Numero di ore lavorative standard per giornata (default: 8)
            </p>
          </div>

          <div>
            <Label htmlFor="tolleranza">Tolleranza Minuti</Label>
            <Input
              id="tolleranza"
              type="number"
              min="0"
              max="60"
              value={config.TOLLERANZA_MINUTI}
              onChange={(e) =>
                setConfig({ ...config, TOLLERANZA_MINUTI: e.target.value })
              }
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tolleranza in minuti per il calcolo degli straordinari (default: ±10 min)
            </p>
          </div>

          <div>
            <Label htmlFor="sessioni">Timeout Sessioni (ore)</Label>
            <Input
              id="sessioni"
              type="number"
              min="1"
              max="24"
              value={config.SESSION_TIMEOUT_ORE}
              onChange={(e) =>
                setConfig({ ...config, SESSION_TIMEOUT_ORE: e.target.value })
              }
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-1">
              Durata massima sessioni utente in ore (default: 8)
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="h-4 w-4" />
              Configurazioni salvate con successo!
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salva Configurazioni
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestione Festività</CardTitle>
          <CardDescription>
            Le festività nazionali italiane sono configurate automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Festività Automatiche 2026:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>1 Gennaio - Capodanno</li>
              <li>6 Gennaio - Epifania</li>
              <li>5 Aprile - Pasqua</li>
              <li>6 Aprile - Lunedì dell&apos;Angelo</li>
              <li>25 Aprile - Festa della Liberazione</li>
              <li>1 Maggio - Festa del Lavoro</li>
              <li>2 Giugno - Festa della Repubblica</li>
              <li>15 Agosto - Ferragosto</li>
              <li>1 Novembre - Tutti i Santi</li>
              <li>8 Dicembre - Immacolata Concezione</li>
              <li>25 Dicembre - Natale</li>
              <li>26 Dicembre - Santo Stefano</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>
            Requisiti di sicurezza per le password utente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Requisiti Attivi:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Lunghezza minima: 12 caratteri</li>
              <li>Hash: bcrypt (cost factor 12)</li>
              <li>Cambio password periodico: Non attivo</li>
              <li>Blocco dopo tentativi falliti: Non attivo</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GDPR & Privacy</CardTitle>
          <CardDescription>
            Impostazioni conformità normativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Funzionalità:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>✓ Audit log completo di tutte le azioni</li>
              <li>✓ Tracking IP e user-agent</li>
              <li>✓ Export dati personali dipendente (GDPR ZIP)</li>
              <li>✓ Versioning timbrature con log modifiche</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Versione:</span>
              <span className="font-medium">1.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Framework:</span>
              <span className="font-medium">Next.js 16 + React 18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="font-medium">PostgreSQL + Prisma ORM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auth:</span>
              <span className="font-medium">NextAuth.js v5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
