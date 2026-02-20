"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface CalendarioProps {
  anno: number;
  mese: number; // 1-12
  onMonthChange: (anno: number, mese: number) => void;
  onDaySelect?: (data: Date) => void;
  selectedDay?: Date | null;
  timbrature?: Map<string, any>;
  festivita?: Date[];
  savedDay?: string | null;
}

export function CalendarioMensile({
  anno,
  mese,
  onMonthChange,
  onDaySelect,
  selectedDay,
  timbrature,
  festivita = [],
  savedDay,
}: CalendarioProps) {
  const mesiNomi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const giorniSettimana = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  const primoGiornoMese = new Date(anno, mese - 1, 1);
  const ultimoGiornoMese = new Date(anno, mese, 0);
  const giorniMese = ultimoGiornoMese.getDate();
  
  // Giorno della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
  let primoGiornoSettimana = primoGiornoMese.getDay();
  // Converti da 0-6 (Dom-Sab) a 0-6 (Lun-Dom)
  primoGiornoSettimana = primoGiornoSettimana === 0 ? 6 : primoGiornoSettimana - 1;

  const handlePrevMonth = () => {
    if (mese === 1) {
      onMonthChange(anno - 1, 12);
    } else {
      onMonthChange(anno, mese - 1);
    }
  };

  const handleNextMonth = () => {
    if (mese === 12) {
      onMonthChange(anno + 1, 1);
    } else {
      onMonthChange(anno, mese + 1);
    }
  };

  const isWeekend = (giorno: number) => {
    const data = new Date(anno, mese - 1, giorno);
    const dayOfWeek = data.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isFestivo = (giorno: number) => {
    const data = new Date(anno, mese - 1, giorno);
    return festivita.some(f => 
      f.getDate() === data.getDate() &&
      f.getMonth() === data.getMonth() &&
      f.getFullYear() === data.getFullYear()
    );
  };

  const isSelected = (giorno: number) => {
    if (!selectedDay) return false;
    const data = new Date(anno, mese - 1, giorno);
    return (
      data.getDate() === selectedDay.getDate() &&
      data.getMonth() === selectedDay.getMonth() &&
      data.getFullYear() === selectedDay.getFullYear()
    );
  };

  const getTimbraturaInfo = (giorno: number) => {
    const dataKey = `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
    return timbrature?.get(dataKey);
  };

  const giorni = [];
  for (let i = 0; i < primoGiornoSettimana; i++) {
    giorni.push(<div key={`empty-${i}`} className="p-2" />);
  }

  for (let giorno = 1; giorno <= giorniMese; giorno++) {
    const weekend = isWeekend(giorno);
    const festivo = isFestivo(giorno);
    const selected = isSelected(giorno);
    const timbratura = getTimbraturaInfo(giorno);
    const oggi = new Date();
    const isOggi =
      giorno === oggi.getDate() &&
      mese - 1 === oggi.getMonth() &&
      anno === oggi.getFullYear();
    const dataKey = `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
    const isSaved = savedDay === dataKey;

    giorni.push(
      <button
        key={giorno}
        onClick={() => onDaySelect?.(new Date(anno, mese - 1, giorno))}
        className={`
          p-2 rounded-lg text-sm transition-colors relative
          ${weekend || festivo ? "bg-red-50 text-red-700" : "hover:bg-gray-100"}
          ${selected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
          ${isOggi ? "font-bold border-2 border-blue-500" : ""}
          ${isSaved ? "bg-green-100 ring-2 ring-green-400" : ""}
        `}
      >
        <div className="font-medium">{giorno}</div>
        {timbratura && (
          <div className="mt-1">
            <div className="text-xs text-gray-600">
              {timbratura.oreLavorate?.toFixed(1)}h
            </div>
            {timbratura.stato && (
              <div
                className={`text-xs mt-0.5 ${
                  timbratura.stato === "APPROVATO"
                    ? "text-green-600"
                    : timbratura.stato === "INVIATO_AD"
                    ? "text-blue-600"
                    : timbratura.stato === "CONFERMATO_GP"
                    ? "text-purple-600"
                    : "text-gray-500"
                }`}
              >
                {timbratura.stato === "APPROVATO" && "✓"}
                {timbratura.stato === "INVIATO_AD" && "→"}
                {timbratura.stato === "CONFERMATO_GP" && "✓"}
                {timbratura.stato === "BOZZA" && "○"}
              </div>
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {mesiNomi[mese - 1]} {anno}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {giorniSettimana.map((giorno) => (
          <div key={giorno} className="p-2 text-center text-sm font-medium text-gray-600">
            {giorno}
          </div>
        ))}
        {giorni}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
          Weekend/Festivo
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-50 border-2 border-blue-500 rounded" />
          Selezionato
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-bold">✓</span>
          Approvato
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-600 font-bold">→</span>
          Inviato AD
        </div>
      </div>
    </div>
  );
}
