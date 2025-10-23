TrekTribe Backend

Backend de la aplicación TrekTribe utilizando Express, TypeScript, Prisma y SQLite.

------------------------------------------------------------
Estructura del proyecto

TrekTribe-Backend/
├─ package.json
├─ tsconfig.json
├─ prisma/
│   ├─ schema.prisma
│   └─ dev.db
├─ src/
│   ├─ server.ts
│   └─ routes/
│       ├─ todos.ts
│       ├─ login.ts
|       └─ register.ts

------------------------------------------------------------
Tecnologías

- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite
- ts-node-dev para desarrollo con recarga automática

------------------------------------------------------------
Requisitos

- Node.js >= 18
- npm >= 9
- Terminal / MacOS

------------------------------------------------------------
Instalación

1. Clonar el repositorio:

git clone https://github.com/tu-usuario/TrekTribe-Backend.git
cd TrekTribe-Backend

2. Instalar dependencias:

npm install

3. Configurar variables de entorno:
Crear un archivo .env en la raíz del proyecto con:
DATABASE_URL="file:./dev.db"

4. Crear migraciones y base de datos:

npx prisma migrate dev --name init

> Esto crea prisma/dev.db y genera las tablas (Todo y otras futuras).

5. Generar Prisma Client:

npx prisma generate

------------------------------------------------------------
Levantar el servidor

Modo desarrollo (con recarga automática):

npm run dev


Servidor disponible en:

http://localhost:3000


------------------------------------------------------------
Scripts disponibles

"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev"
}

- npm run dev → Levanta el servidor en modo desarrollo
- npm run build → Compila TypeScript a JavaScript
- npm run start → Levanta el servidor en modo producción
- npm run prisma:generate → Genera Prisma Client
- npm run prisma:migrate → Ejecuta migraciones de base de datos

------------------------------------------------------------
Notas importantes

- Si cambiás el schema.prisma o el proveedor de la base de datos, borrá la carpeta prisma/migrations y generá nuevamente la migración para evitar errores.
- La base de datos usada es SQLite (dev.db) y se encuentra en la carpeta prisma/.
