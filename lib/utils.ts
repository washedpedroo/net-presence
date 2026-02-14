import { parse, differenceInMinutes, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

const ORE_STANDARD = 8;
const TOLLERANZA_MINUTI = 10;

interface Timeslot {
  entrata?: string | null;
  uscita?: string | null;
}

export interface CalcoloOre {
  oreLavorate: number;
  straordinari: number;
  errori: string[];
}

/**
 * Calcola le ore lavorate e gli straordinari da 4 slot di timbratura
 */
export function calcolaOreLavorate(
  entrata1?: string | null,
  uscita1?: string | null,
  entrata2?: string | null,
  uscita2?: string | null
): CalcoloOre {
  const errori: string[] = [];
  let minutiTotali = 0;

  // Helper per parsare orario
  const parseTime = (time: string | null | undefined): Date | null => {
    if (!time) return null;
    try {
      return parse(time, 'HH:mm', new Date());
    } catch {
      return null;
    }
  };

  // Slot 1
  if (entrata1 || uscita1) {
    const e1 = parseTime(entrata1);
    const u1 = parseTime(uscita1);

    if (!e1 || !u1) {
      errori.push("Slot 1: entrambi entrata e uscita devono essere compilati");
    } else if (u1 <= e1) {
      errori.push("Slot 1: l'uscita deve essere dopo l'entrata");
    } else {
      minutiTotali += differenceInMinutes(u1, e1);
    }
  }

  // Slot 2
  if (entrata2 || uscita2) {
    const e2 = parseTime(entrata2);
    const u2 = parseTime(uscita2);

    if (!e2 || !u2) {
      errori.push("Slot 2: entrambi entrata e uscita devono essere compilati");
    } else if (u2 <= e2) {
      errori.push("Slot 2: l'uscita deve essere dopo l'entrata");
    } else {
      // Verifica sovrapposizione con slot 1
      const u1 = parseTime(uscita1);
      if (u1 && e2 < u1) {
        errori.push("Slot 2: non può sovrapporsi con Slot 1");
      } else {
        minutiTotali += differenceInMinutes(u2, e2);
      }
    }
  }

  const oreLavorate = minutiTotali / 60;
  
  // Calcolo straordinari con tolleranza
  const minutiStandard = ORE_STANDARD * 60;
  const differenza = minutiTotali - minutiStandard;
  
  let straordinari = 0;
  if (differenza > TOLLERANZA_MINUTI) {
    straordinari = (differenza - TOLLERANZA_MINUTI) / 60;
  }

  // Alert anomalie
  if (oreLavorate < ORE_STANDARD - 0.5 && oreLavorate > 0) {
    errori.push(`Attenzione: ore lavorate (${oreLavorate.toFixed(2)}) inferiori alle 8 ore standard`);
  }
  if (straordinari > 4) {
    errori.push(`Attenzione: straordinari elevati (${straordinari.toFixed(2)} ore)`);
  }

  return {
    oreLavorate: Math.round(oreLavorate * 100) / 100,
    straordinari: Math.round(straordinari * 100) / 100,
    errori
  };
}

/**
 * Verifica se una data è un weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Domenica o Sabato
}

/**
 * Calcola la Pasqua per un dato anno (algoritmo di Meeus)
 */
function calcolaPasqua(anno: number): Date {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(anno, mese - 1, giorno);
}

/**
 * Ritorna la lista delle festività nazionali italiane per un dato anno
 */
export function getFestivitaItaliane(anno: number): Date[] {
  const festivita: Date[] = [
    new Date(anno, 0, 1),   // Capodanno
    new Date(anno, 0, 6),   // Epifania
    new Date(anno, 3, 25),  // Liberazione
    new Date(anno, 4, 1),   // Festa del Lavoro
    new Date(anno, 5, 2),   // Festa della Repubblica
    new Date(anno, 7, 15),  // Ferragosto
    new Date(anno, 10, 1),  // Tutti i Santi
    new Date(anno, 11, 8),  // Immacolata
    new Date(anno, 11, 25), // Natale
    new Date(anno, 11, 26), // Santo Stefano
  ];

  // Aggiungi Pasqua e Lunedì dell'Angelo
  const pasqua = calcolaPasqua(anno);
  festivita.push(pasqua); // Pasqua
  festivita.push(addDays(pasqua, 1)); // Lunedì dell'Angelo

  return festivita;
}

/**
 * Verifica se una data è festiva
 */
export function isFestivo(date: Date, festivita: Date[]): boolean {
  return festivita.some(f => 
    f.getDate() === date.getDate() &&
    f.getMonth() === date.getMonth() &&
    f.getFullYear() === date.getFullYear()
  );
}

/**
 * Formatta ore in formato leggibile
 */
export function formatOre(ore: number): string {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m}m`;
}
