import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inizio seeding del database...');

  // Configurazioni di sistema
  await prisma.configuration.upsert({
    where: { chiave: 'ORE_STANDARD' },
    update: {},
    create: {
      chiave: 'ORE_STANDARD',
      valore: '8',
      descrizione: 'Ore lavorative standard per giornata',
    },
  });

  await prisma.configuration.upsert({
    where: { chiave: 'TOLLERANZA_MINUTI' },
    update: {},
    create: {
      chiave: 'TOLLERANZA_MINUTI',
      valore: '10',
      descrizione: 'Tolleranza in minuti per straordinari',
    },
  });

  await prisma.configuration.upsert({
    where: { chiave: 'SESSION_TIMEOUT_ORE' },
    update: {},
    create: {
      chiave: 'SESSION_TIMEOUT_ORE',
      valore: '8',
      descrizione: 'Durata massima sessioni utente in ore',
    },
  });
  console.log('✅ Create configurazioni di sistema');

  // Festività italiane 2026
  const festivita2026 = [
    { data: new Date('2026-01-01'), nome: 'Capodanno' },
    { data: new Date('2026-01-06'), nome: 'Epifania' },
    { data: new Date('2026-04-05'), nome: 'Pasqua' },
    { data: new Date('2026-04-06'), nome: "Lunedì dell'Angelo" },
    { data: new Date('2026-04-25'), nome: 'Festa della Liberazione' },
    { data: new Date('2026-05-01'), nome: 'Festa del Lavoro' },
    { data: new Date('2026-06-02'), nome: 'Festa della Repubblica' },
    { data: new Date('2026-08-15'), nome: 'Ferragosto' },
    { data: new Date('2026-11-01'), nome: 'Tutti i Santi' },
    { data: new Date('2026-12-08'), nome: 'Immacolata Concezione' },
    { data: new Date('2026-12-25'), nome: 'Natale' },
    { data: new Date('2026-12-26'), nome: 'Santo Stefano' },
  ];

  for (const fest of festivita2026) {
    await prisma.festivita.upsert({
      where: { data: fest.data },
      update: {},
      create: fest,
    });
  }
  console.log('✅ Create festività 2026');

  console.log('');
  console.log('🎉 Seeding completato!');
  console.log('');
  console.log('Nota: nessun utente di default è stato creato.');
  console.log('Creare il primo utente ADMIN direttamente nel database oppure tramite uno script separato.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
