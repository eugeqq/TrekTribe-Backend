/*
  Warnings:

  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Usuario_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Usuario";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "creadoAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMensaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contenido" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "viajeId" INTEGER NOT NULL,
    "enviadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMensaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChatMensaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChatMensaje" ("contenido", "enviadoEn", "id", "usuarioId", "viajeId") SELECT "contenido", "enviadoEn", "id", "usuarioId", "viajeId" FROM "ChatMensaje";
DROP TABLE "ChatMensaje";
ALTER TABLE "new_ChatMensaje" RENAME TO "ChatMensaje";
CREATE TABLE "new_Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monto" REAL NOT NULL,
    "categoria" TEXT,
    "descripcion" TEXT,
    "pagadoPorId" INTEGER NOT NULL,
    "viajeId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gasto_pagadoPorId_fkey" FOREIGN KEY ("pagadoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gasto_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Gasto" ("categoria", "creadoEn", "descripcion", "id", "monto", "pagadoPorId", "viajeId") SELECT "categoria", "creadoEn", "descripcion", "id", "monto", "pagadoPorId", "viajeId" FROM "Gasto";
DROP TABLE "Gasto";
ALTER TABLE "new_Gasto" RENAME TO "Gasto";
CREATE TABLE "new_MiembroViaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "viajeId" INTEGER NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'miembro',
    CONSTRAINT "MiembroViaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiembroViaje_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MiembroViaje" ("id", "rol", "usuarioId", "viajeId") SELECT "id", "rol", "usuarioId", "viajeId" FROM "MiembroViaje";
DROP TABLE "MiembroViaje";
ALTER TABLE "new_MiembroViaje" RENAME TO "MiembroViaje";
CREATE TABLE "new_Tarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "responsableId" INTEGER,
    "viajeId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tarea_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tarea" ("creadoEn", "descripcion", "estado", "id", "responsableId", "titulo", "viajeId") SELECT "creadoEn", "descripcion", "estado", "id", "responsableId", "titulo", "viajeId" FROM "Tarea";
DROP TABLE "Tarea";
ALTER TABLE "new_Tarea" RENAME TO "Tarea";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
