import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inizio seeding del database...');

  // Crea utente ADMIN
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@presenze.it' },
    update: {},
    create: {
      email: 'admin@presenze.it',
      passwordHash: adminPasswordHash,
      nome: 'Mario',
      cognome: 'Rossi',
      ruolo: 'ADMIN',
      attivo: true,
    },
  });
  console.log('✅ Creato utente ADMIN:', admin.email);

  // Crea utente GP
  const gpPasswordHash = await bcrypt.hash('GpPassword123!', 12);
  const gp = await prisma.user.upsert({
    where: { email: 'gp@presenze.it' },
    update: {},
    create: {
      email: 'gp@presenze.it',
      passwordHash: gpPasswordHash,
      nome: 'Laura',
      cognome: 'Bianchi',
      ruolo: 'GP',
      attivo: true,
    },
  });
  console.log('✅ Creato utente GP:', gp.email);

  // Crea utente DIPENDENTE
  const dipPasswordHash = await bcrypt.hash('DipPassword123!', 12);
  const dipendente = await prisma.user.upsert({
    where: { email: 'dipendente@presenze.it' },
    update: {},
    create: {
      email: 'dipendente@presenze.it',
      passwordHash: dipPasswordHash,
      nome: 'Giovanni',
      cognome: 'Verdi',
      ruolo: 'DIPENDENTE',
      attivo: true,
    },
  });
  console.log('✅ Creato utente DIPENDENTE:', dipendente.email);

  // Crea employee per il dipendente
  const employee = await prisma.employee.upsert({
    where: { userId: dipendente.id },
    update: {},
    create: {
      userId: dipendente.id,
      codiceFiscale: 'VRDGNN80A01H501Z',
      dataNascita: new Date('1980-01-01'),
      luogoNascita: 'Roma',
      indirizzo: 'Via Roma 1',
      citta: 'Milano',
      cap: '20100',
      telefono: '3331234567',
      dataAssunzione: new Date('2020-01-01'),
    },
  });
  console.log('✅ Creato employee per:', dipendente.email);

  // Crea template orari per il dipendente
  await prisma.employeeTemplate.upsert({
    where: { employeeId: employee.id },
    update: {},
    create: {
      employeeId: employee.id,
      lunediInizio: '09:00',
      lunediFine: '18:00',
      martediInizio: '09:00',
      martediFine: '18:00',
      mercolediInizio: '09:00',
      mercolediFine: '18:00',
      giovediInizio: '09:00',
      giovediFine: '18:00',
      venerdiInizio: '09:00',
      venerdiFine: '18:00',
    },
  });
  console.log('✅ Creato template orari per:', dipendente.email);

  // Crea configurazioni di sistema
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
  console.log('✅ Create configurazioni di sistema');

  // Crea festività italiane 2026
  const festivita2026 = [
    { data: new Date('2026-01-01'), nome: 'Capodanno' },
    { data: new Date('2026-01-06'), nome: 'Epifania' },
    { data: new Date('2026-04-05'), nome: 'Pasqua' },
    { data: new Date('2026-04-06'), nome: 'Lunedì dell\'Angelo' },
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
  console.log('Credenziali di accesso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMIN:');
  console.log('  Email: admin@presenze.it');
  console.log('  Password: AdminPassword123!');
  console.log('');
  console.log('GP (Gestore Presenze):');
  console.log('  Email: gp@presenze.it');
  console.log('  Password: GpPassword123!');
  console.log('');
  console.log('DIPENDENTE:');
  console.log('  Email: dipendente@presenze.it');
  console.log('  Password: DipPassword123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
