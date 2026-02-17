-- AlterTable: Remove biographical data columns from employees
ALTER TABLE "employees" DROP COLUMN "dataNascita";
ALTER TABLE "employees" DROP COLUMN "luogoNascita";
ALTER TABLE "employees" DROP COLUMN "indirizzo";
ALTER TABLE "employees" DROP COLUMN "citta";
ALTER TABLE "employees" DROP COLUMN "cap";
ALTER TABLE "employees" DROP COLUMN "telefono";
ALTER TABLE "employees" DROP COLUMN "dataAssunzione";
