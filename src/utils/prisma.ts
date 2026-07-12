import { PrismaClient } from "@prisma/client";

// Instancia única compartida por toda la app. Antes cada archivo de rutas
// creaba su propio `new PrismaClient()` (9 instancias distintas), cada una
// abriendo su propio pool de conexiones.
const prisma = new PrismaClient();

export default prisma;
