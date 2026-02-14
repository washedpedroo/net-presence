-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GP', 'DIPENDENTE');

-- CreateEnum
CREATE TYPE "StatoGiustificativo" AS ENUM ('PENDING', 'APPROVATO', 'RIFIUTATO');

-- CreateEnum
CREATE TYPE "TipoGiustificativo" AS ENUM ('FERIE', 'PERMESSO', 'EX_FESTIVITA', 'MALATTIA');

-- CreateEnum
CREATE TYPE "StatoTimbrature" AS ENUM ('BOZZA', 'CONFERMATO_GP', 'INVIATO_AD', 'APPROVATO', 'RIGETTATO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "ruolo" "UserRole" NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "dataNascita" TIMESTAMP(3) NOT NULL,
    "luogoNascita" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "citta" TEXT NOT NULL,
    "cap" TEXT NOT NULL,
    "telefono" TEXT,
    "dataAssunzione" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_templates" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lunediInizio" TEXT,
    "lunediFine" TEXT,
    "martediInizio" TEXT,
    "martediFine" TEXT,
    "mercolediInizio" TEXT,
    "mercolediFine" TEXT,
    "giovediInizio" TEXT,
    "giovediFine" TEXT,
    "venerdiInizio" TEXT,
    "venerdiFine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timbrature" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "anno" INTEGER NOT NULL,
    "mese" INTEGER NOT NULL,
    "entrata1" TEXT,
    "uscita1" TEXT,
    "entrata2" TEXT,
    "uscita2" TEXT,
    "oreLavorate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "straordinari" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "stato" "StatoTimbrature" NOT NULL DEFAULT 'BOZZA',
    "confermatoGpAt" TIMESTAMP(3),
    "inviatoAdAt" TIMESTAMP(3),
    "approvatoAt" TIMESTAMP(3),
    "rigettatoAt" TIMESTAMP(3),
    "motivazioneRigetto" TEXT,
    "versione" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "timbrature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timbratura_versions" (
    "id" TEXT NOT NULL,
    "timbraturaId" TEXT NOT NULL,
    "versione" INTEGER NOT NULL,
    "entrata1" TEXT,
    "uscita1" TEXT,
    "entrata2" TEXT,
    "uscita2" TEXT,
    "oreLavorate" DOUBLE PRECISION NOT NULL,
    "straordinari" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "modificatoDa" TEXT NOT NULL,
    "modificatoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timbratura_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giustificativi" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tipo" "TipoGiustificativo" NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3),
    "oraInizio" TEXT,
    "oraFine" TEXT,
    "oreTotali" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descrizione" TEXT,
    "stato" "StatoGiustificativo" NOT NULL DEFAULT 'PENDING',
    "richiestoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvatoAt" TIMESTAMP(3),
    "rigettatoAt" TIMESTAMP(3),
    "approvatoDa" TEXT,
    "motivazioneRigetto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giustificativi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giustificativo_timeline" (
    "id" TEXT NOT NULL,
    "giustificativoId" TEXT NOT NULL,
    "stato" "StatoGiustificativo" NOT NULL,
    "nota" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giustificativo_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivita" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "nome" TEXT NOT NULL,
    "nazionale" BOOLEAN NOT NULL DEFAULT true,
    "regione" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "festivita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "valore" TEXT NOT NULL,
    "descrizione" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "azione" TEXT NOT NULL,
    "entita" TEXT,
    "entitaId" TEXT,
    "dettagli" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_codiceFiscale_key" ON "employees"("codiceFiscale");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_templates_employeeId_key" ON "employee_templates"("employeeId");

-- CreateIndex
CREATE INDEX "timbrature_employeeId_anno_mese_idx" ON "timbrature"("employeeId", "anno", "mese");

-- CreateIndex
CREATE INDEX "timbrature_stato_idx" ON "timbrature"("stato");

-- CreateIndex
CREATE UNIQUE INDEX "timbrature_employeeId_data_key" ON "timbrature"("employeeId", "data");

-- CreateIndex
CREATE INDEX "timbratura_versions_timbraturaId_idx" ON "timbratura_versions"("timbraturaId");

-- CreateIndex
CREATE INDEX "giustificativi_employeeId_stato_idx" ON "giustificativi"("employeeId", "stato");

-- CreateIndex
CREATE INDEX "giustificativi_stato_idx" ON "giustificativi"("stato");

-- CreateIndex
CREATE INDEX "giustificativo_timeline_giustificativoId_idx" ON "giustificativo_timeline"("giustificativoId");

-- CreateIndex
CREATE UNIQUE INDEX "festivita_data_key" ON "festivita"("data");

-- CreateIndex
CREATE INDEX "festivita_data_idx" ON "festivita"("data");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_chiave_key" ON "configurations"("chiave");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_azione_idx" ON "audit_logs"("azione");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_templates" ADD CONSTRAINT "employee_templates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timbrature" ADD CONSTRAINT "timbrature_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timbratura_versions" ADD CONSTRAINT "timbratura_versions_timbraturaId_fkey" FOREIGN KEY ("timbraturaId") REFERENCES "timbrature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giustificativi" ADD CONSTRAINT "giustificativi_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giustificativo_timeline" ADD CONSTRAINT "giustificativo_timeline_giustificativoId_fkey" FOREIGN KEY ("giustificativoId") REFERENCES "giustificativi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
