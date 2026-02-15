import { prisma } from "./prisma";

export type TipoNotifica =
  | "GIUSTIFICATIVO_RICHIESTO"
  | "GIUSTIFICATIVO_APPROVATO"
  | "GIUSTIFICATIVO_RIFIUTATO"
  | "TIMBRATURA_CONFERMATA"
  | "PRESENZE_INVIATE"
  | "PRESENZE_APPROVATE"
  | "PRESENZE_RIFIUTATE";

export async function creaNotifica(
  userId: string,
  tipo: TipoNotifica,
  titolo: string,
  messaggio: string,
  entitaId?: string,
  entitaTipo?: string
): Promise<void> {
  try {
    await prisma.notifica.create({
      data: {
        userId,
        tipo,
        titolo,
        messaggio,
        entitaId,
        entitaTipo,
      },
    });
  } catch (error) {
    // Non bloccare il flusso principale se la notifica fallisce
    console.error("Errore creazione notifica:", error);
  }
}

/**
 * Crea notifiche per tutti gli utenti con un determinato ruolo
 */
export async function creaNotificaPerRuolo(
  ruolo: "ADMIN" | "AD" | "GP" | "DIPENDENTE",
  tipo: TipoNotifica,
  titolo: string,
  messaggio: string,
  entitaId?: string,
  entitaTipo?: string
): Promise<void> {
  try {
    const utenti = await prisma.user.findMany({
      where: { ruolo, attivo: true },
      select: { id: true },
    });

    await Promise.all(
      utenti.map((u) =>
        creaNotifica(u.id, tipo, titolo, messaggio, entitaId, entitaTipo)
      )
    );
  } catch (error) {
    console.error("Errore creazione notifiche per ruolo:", error);
  }
}
