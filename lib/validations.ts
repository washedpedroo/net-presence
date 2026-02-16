import { z } from "zod";

// Validazione formato orario HH:MM
const orarioRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const orarioSchema = z.string().regex(orarioRegex, {
  message: "Formato orario non valido. Usa HH:MM (es: 09:30)"
});

// Schema per timbratura
export const timbraturaSchema = z.object({
  employeeId: z.string().min(1, "Dipendente obbligatorio"),
  data: z.string().or(z.date()),
  entrata1: orarioSchema.optional().nullable(),
  uscita1: orarioSchema.optional().nullable(),
  entrata2: orarioSchema.optional().nullable(),
  uscita2: orarioSchema.optional().nullable(),
  note: z.string().min(1, "Le note sono obbligatorie").max(500),
}).refine((data) => {
  // Almeno un slot deve essere compilato
  return !!(data.entrata1 || data.uscita1 || data.entrata2 || data.uscita2);
}, {
  message: "Almeno uno slot di timbratura deve essere compilato"
});

// Schema per giustificativo - Ferie
export const feriSchema = z.object({
  tipo: z.literal("FERIE"),
  dataInizio: z.string().or(z.date()),
  dataFine: z.string().or(z.date()),
  descrizione: z.string().optional(),
}).refine((data) => {
  const inizio = new Date(data.dataInizio);
  const fine = new Date(data.dataFine);
  return fine >= inizio;
}, {
  message: "La data di fine deve essere successiva o uguale alla data di inizio"
});

// Schema per giustificativo - Permesso/Ex Festività
export const permessoSchema = z.object({
  tipo: z.enum(["PERMESSO", "EX_FESTIVITA"]),
  dataInizio: z.string().or(z.date()),
  oraInizio: orarioSchema,
  oraFine: orarioSchema,
  descrizione: z.string().optional(),
}).refine((data) => {
  // Validazione minimo 10 minuti
  const [h1, m1] = data.oraInizio.split(':').map(Number);
  const [h2, m2] = data.oraFine.split(':').map(Number);
  const minutiTotali = (h2 * 60 + m2) - (h1 * 60 + m1);
  return minutiTotali >= 10 && minutiTotali <= 480; // max 8 ore
}, {
  message: "Il permesso deve essere tra 10 minuti e 8 ore"
});

// Schema per creazione utente
export const createUserSchema = z.object({
  password: z.string().min(12, "La password deve essere di almeno 12 caratteri"),
  nome: z.string().min(2, "Nome obbligatorio"),
  cognome: z.string().min(2, "Cognome obbligatorio"),
  ruolo: z.enum(["ADMIN", "AD", "GP", "DIPENDENTE"]),

  // Dati dipendente (opzionali se non DIPENDENTE)
  dataNascita: z.string().or(z.date()).optional(),
  luogoNascita: z.string().optional(),
  indirizzo: z.string().optional(),
  citta: z.string().optional(),
  cap: z.string().optional(),
  telefono: z.string().optional(),
  dataAssunzione: z.string().or(z.date()).optional(),
}).refine((data) => {
  // Se DIPENDENTE, i dati anagrafici sono obbligatori
  if (data.ruolo === "DIPENDENTE") {
    return !!(
      data.dataNascita &&
      data.luogoNascita &&
      data.indirizzo &&
      data.citta &&
      data.cap &&
      data.dataAssunzione
    );
  }
  return true;
}, {
  message: "Per i dipendenti, tutti i dati anagrafici sono obbligatori"
});

// Schema per template orari
export const templateSchema = z.object({
  employeeId: z.string().min(1),
  lunediInizio: orarioSchema.optional().nullable(),
  lunediFine: orarioSchema.optional().nullable(),
  martediInizio: orarioSchema.optional().nullable(),
  martediFine: orarioSchema.optional().nullable(),
  mercolediInizio: orarioSchema.optional().nullable(),
  mercolediFine: orarioSchema.optional().nullable(),
  giovediInizio: orarioSchema.optional().nullable(),
  giovediFine: orarioSchema.optional().nullable(),
  venerdiInizio: orarioSchema.optional().nullable(),
  venerdiFine: orarioSchema.optional().nullable(),
});
