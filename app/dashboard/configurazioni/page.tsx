"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

export default function ConfigurazioniPage() {
  const [config, setConfig] = useState({
    oreStandard: "8",
    tolleranzaMinuti: "10",
    sessioni: "8",
  });

  const handleSave = () => {
    alert("Configurazioni salvate! (Funzionalità da implementare)");
  };

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
              value={config.oreStandard}
              onChange={(e) =>
                setConfig({ ...config, oreStandard: e.target.value })
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
              value={config.tolleranzaMinuti}
              onChange={(e) =>
                setConfig({ ...config, tolleranzaMinuti: e.target.value })
              }
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tolleranza in minuti per il calcolo degli straordinari (default: ±10
              min)
            </p>
          </div>

          <div>
            <Label htmlFor="sessioni">Timeout Sessioni (ore)</Label>
            <Input
              id="sessioni"
              type="number"
              value={config.sessioni}
              onChange={(e) =>
                setConfig({ ...config, sessioni: e.target.value })
              }
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-1">
              Durata massima sessioni utente in ore (default: 8)
            </p>
          </div>

          <Button onClick={handleSave} className="mt-4">
            <Save className="mr-2 h-4 w-4" />
            Salva Configurazioni
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
              <li>6 Aprile - Lunedì dell'Angelo</li>
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
            <p className="font-medium">Funzionalità Implementate:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>✓ Audit log completo di tutte le azioni</li>
              <li>✓ Tracking IP e user-agent</li>
              <li>✓ Dati sensibili con crittografia at-rest</li>
              <li>✓ Export dati personali dipendente</li>
              <li>○ Diritto all'oblio (anonimizzazione) - Da implementare</li>
              <li>○ Cookie banner e consensi - Da implementare</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Monitoraggio</CardTitle>
          <CardDescription>
            Configurazioni backup e alerting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-2">Stato Sistema:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3">
                  <div className="text-gray-600">Database</div>
                  <div className="font-semibold text-green-600">✓ Operativo</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-gray-600">API</div>
                  <div className="font-semibold text-green-600">✓ Operativo</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-gray-600">Backup Automatico</div>
                  <div className="font-semibold text-orange-600">
                    ○ Non Configurato
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-gray-600">Monitoring</div>
                  <div className="font-semibold text-orange-600">
                    ○ Non Configurato
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Raccomandazioni:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Configurare backup automatico giornaliero del database</li>
                <li>Implementare monitoring con Sentry/Datadog</li>
                <li>Configurare alert per errori critici</li>
                <li>Setup environment staging per test</li>
              </ul>
            </div>
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
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Build:</span>
              <span className="font-medium">Production</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Framework:</span>
              <span className="font-medium">Next.js 14 + React 18</span>
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
