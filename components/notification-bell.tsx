"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Notifica {
  id: string;
  tipo: string;
  titolo: string;
  messaggio: string;
  letta: boolean;
  entitaId?: string;
  entitaTipo?: string;
  createdAt: string;
}

export function NotificationBell() {
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const nonLette = notifiche.filter((n) => !n.letta).length;

  const fetchNotifiche = async () => {
    try {
      const res = await fetch("/api/notifiche");
      if (res.ok) {
        const data = await res.json();
        setNotifiche(data);
      }
    } catch {
      // silenzioso
    }
  };

  useEffect(() => {
    fetchNotifiche();
    const interval = setInterval(fetchNotifiche, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chiudi dropdown cliccando fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const segnaLetta = async (id: string) => {
    try {
      await fetch(`/api/notifiche/${id}`, { method: "PATCH" });
      setNotifiche((prev) =>
        prev.map((n) => (n.id === id ? { ...n, letta: true } : n))
      );
    } catch {}
  };

  const elimina = async (id: string) => {
    try {
      await fetch(`/api/notifiche/${id}`, { method: "DELETE" });
      setNotifiche((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const segnaLetteTutte = async () => {
    try {
      await fetch("/api/notifiche/leggi-tutte", { method: "POST" });
      setNotifiche((prev) => prev.map((n) => ({ ...n, letta: true })));
    } catch {}
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes("APPROVATO")) return "✅";
    if (tipo.includes("RIFIUTATO") || tipo.includes("RIGETTATO")) return "❌";
    if (tipo.includes("RICHIESTO")) return "📋";
    if (tipo.includes("CONFERMATA")) return "🔔";
    if (tipo.includes("INVIATE")) return "📤";
    return "ℹ️";
  };

  const formatData = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minuti = Math.floor(diff / 60000);
    if (minuti < 1) return "Adesso";
    if (minuti < 60) return `${minuti}m fa`;
    const ore = Math.floor(minuti / 60);
    if (ore < 24) return `${ore}h fa`;
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Notifiche"
      >
        <Bell className="h-5 w-5 text-gray-300" />
        {nonLette > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {nonLette > 9 ? "9+" : nonLette}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">
              Notifiche
              {nonLette > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                  {nonLette}
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              {nonLette > 0 && (
                <button
                  onClick={segnaLetteTutte}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Segna tutte lette
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifiche.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Nessuna notifica
              </div>
            ) : (
              notifiche.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.letta ? "bg-blue-50/50" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getTipoIcon(n.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm font-medium text-gray-800 ${!n.letta ? "font-semibold" : ""}`}>
                        {n.titolo}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatData(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {n.messaggio}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!n.letta && (
                      <button
                        onClick={() => segnaLetta(n.id)}
                        title="Segna come letta"
                        className="p-1 text-blue-500 hover:text-blue-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => elimina(n.id)}
                      title="Elimina"
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
