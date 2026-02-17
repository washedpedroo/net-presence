import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin.finafarm';
  const password = 'FinafarmAdminLogin987!!';

  // Controlla se l'utente esiste già
  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    console.log(`L'utente "${username}" esiste già.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      nome: 'Admin',
      cognome: 'Finafarm',
      ruolo: 'ADMIN',
      attivo: true,
    },
  });

  console.log(`Utente ADMIN creato con successo!`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Username: ${user.username}`);
  console.log(`  Ruolo: ${user.ruolo}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Errore durante la creazione dell\'utente:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
