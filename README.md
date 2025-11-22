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
  "dev": "ts-node-dev --respawn --transpile-only --prefer-ts-exts src/server.ts",
  "dev:build": "tsc --watch -p tsconfig.json",
  "dev:run": "node dist/server.js",
  "build": "tsc",
  "start": "node dist/server.js",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint"
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

### Sobre el cliente de Prisma y archivos generados

- El cliente generado de Prisma (`prisma/generated/` o `prisma/prisma/`) y la base de datos local `prisma/dev.db` NO están versionados en el repositorio por diseño.
- Esto evita conflictos y mantiene el repo liviano; en su lugar, cada desarrollador (y CI) debe ejecutar `npx prisma generate` localmente para generar `@prisma/client`.

Si clonas el repositorio, asegúrate de ejecutar:

```bash
# instalar dependencias
npm install

# generar prisma client (si no lo hizo postinstall)
npx prisma generate

# (opcional) aplicar migraciones locales a la sqlite dev.db
npx prisma migrate dev --name init
```

### Variables de entorno adicionales (Cloudinary)

Si usas las rutas que suben imágenes a Cloudinary, añade estas variables a tu `.env`:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```
