# TrekTribe Backend

Backend de **TrekTribe**, una app para organizar viajes en grupo. Hecho con Express, TypeScript, Prisma y SQLite.

Este es el repositorio del **backend**. El [frontend](../TrekTribe) necesita que este servidor esté corriendo para funcionar.

## Índice

- [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
- [Conectar Cloudinary (subida de imágenes)](#conectar-cloudinary-subida-de-imágenes)
- [Autenticación](#autenticación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos de datos](#modelos-de-datos)
- [Endpoints principales](#endpoints-principales)
- [Troubleshooting](#troubleshooting)

## Cómo levantar el proyecto

Necesitás **Node.js 18+** y **npm**. La base de datos es SQLite, no requiere instalar nada aparte.

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Crear el archivo `.env`** en la raíz del proyecto:
   ```env
   DATABASE_URL="file:./dev.db"
   PORT=3000
   JWT_SECRET=un_secreto_largo_y_dificil_de_adivinar

   # Opcional: sin esto, todo funciona menos la subida de imágenes.
   # Ver la sección "Conectar Cloudinary" más abajo.
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```
   (Comando para crear secret:node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

3. **Crear la base de datos y aplicar las migraciones**
   ```bash
   npx prisma migrate dev
   ```
   Esto crea `prisma/dev.db`, aplica todas las migraciones y genera el cliente de Prisma.

4. **Levantar el servidor**
   ```bash
   npm run dev
   ```
   Queda escuchando en `http://localhost:3000` (con recarga automática al cambiar archivos).

Con eso ya está listo para que el frontend se conecte. Para ver/editar los datos a mano:
```bash
npx prisma studio
```
Abre una interfaz visual en `http://localhost:5555`.

### Modo producción

```bash
npm run build   # compila TypeScript a dist/
npm start       # corre el compilado
```

## Conectar Cloudinary (subida de imágenes)

Cloudinary guarda las imágenes (avatares y fotos de tribu). Sin credenciales válidas, el resto de la app funciona igual, pero subir una foto falla.

1. Creá una cuenta gratis en [cloudinary.com](https://cloudinary.com/users/register/free).
2. En el [Dashboard](https://console.cloudinary.com/), copiá **Cloud Name**, **API Key** y **API Secret** (usá el botón de copiar del "Reveal" del secret, no lo tipees a mano) y pegalos en el `.env`.
3. Reiniciá el servidor para que tome las variables nuevas.
4. Usá la API Key **Root** de la cuenta (Settings → API Keys), no una key secundaria con permisos restringidos — si no, vas a ver errores `403` al subir imágenes aunque las credenciales sean correctas.

| Error | Causa típica |
|---|---|
| `Invalid Signature` | El `API_SECRET` está mal copiado |
| `403 Server returned unexpected status code` | Estás usando una API Key que no es la Root |
| Error genérico al subir | Faltan variables en `.env`, o no reiniciaste el servidor después de agregarlas |

## Autenticación

- El login (`POST /login`) devuelve un JWT válido por 7 días.
- Todas las rutas (excepto `/login` y `/register`) requieren el header `Authorization: Bearer <token>`; lo valida el middleware `requireAuth` (`src/middleware/auth.ts`).
- La identidad del usuario siempre se toma del token verificado (`req.userId`), nunca de un id que venga en el body o la URL — así nadie puede actuar en nombre de otro usuario con un request armado a mano.
- Para las acciones dentro de una tribu (agregar/sacar miembros, gastos, tareas, itinerario), alcanza con ser **miembro** de esa tribu; no hace falta ser el creador ni tener rol admin.
- `POST /login/logout` revoca el token del lado del servidor (queda en una blacklist en memoria).

## Estructura del proyecto

```
src/
├── server.ts              # Punto de entrada (carga .env y arranca el servidor)
├── app.ts                 # Configuración de Express y montaje de rutas
├── middleware/
│   ├── auth.ts             # requireAuth: valida el JWT
│   └── upload.ts           # Multer: límite de 5MB, solo imágenes
├── routes/
│   ├── login.ts / register.ts
│   ├── user.ts             # Perfil de usuario
│   ├── tribes.ts           # Crear tribu
│   ├── viajes.ts           # Tribus: miembros, gastos, settlements, itinerario, chat grupal
│   ├── tareas.ts           # Tareas dentro de un viaje
│   ├── gastos.ts           # Gastos compartidos
│   └── chats.ts            # Chat 1 a 1
└── utils/
    ├── prisma.ts            # Instancia única de PrismaClient
    ├── permissions.ts       # esMiembroDelViaje()
    ├── format.ts            # Selects/formato de nombre reusados en las respuestas
    └── cloudinary.ts        # uploadBuffer()
```

## Modelos de datos

| Modelo | Qué guarda |
|---|---|
| **User** | Usuarios registrados |
| **Viaje** | Una tribu/viaje |
| **MiembroViaje** | Relación usuario↔viaje (rol admin/miembro, y `chatLeidoEn` para el chat grupal) |
| **Tarea** | Tareas dentro de un viaje |
| **Gasto** | Gastos compartidos y quién los pagó |
| **Settlement** | Pagos que saldan deudas entre miembros ("Saldar Cuentas") |
| **ItinerarioEvento** | Actividades planificadas del viaje |
| **ChatMensaje** | Mensajes del chat grupal de un viaje |
| **Chat** / **MensajeChatPrivado** | Chat 1 a 1 entre dos usuarios |

Ver la definición completa en [`prisma/schema.prisma`](prisma/schema.prisma).

## Endpoints principales

Todos requieren `Authorization: Bearer <token>` salvo los dos primeros.

**Autenticación**
- `POST /login` · `POST /login/logout` · `POST /login/validate-session`
- `POST /register`

**Usuario**
- `GET /user/:id` · `PUT /user/:id`

**Tribus (viajes)**
- `POST /tribes` — crear tribu
- `GET /viajes/usuario/:id` — tribus de un usuario
- `GET /viajes/detalle/:id` — detalle de una tribu
- `POST /viajes/:id/miembros` · `DELETE /viajes/:viajeId/miembros/:usuarioId`
- `GET /viajes/:viajeId/participantes`

**Tareas**
- `GET /viajes/:viajeId/tareas` · `POST /viajes/:viajeId/tareas`
- `PUT /tareas/:id` · `DELETE /tareas/:id`

**Gastos y saldos**
- `GET /viajes/:viajeId/gastos` · `POST /gastos` · `PUT /gastos/:id` · `DELETE /gastos/:id`
- `GET /viajes/:viajeId/settlements` · `POST /viajes/:viajeId/settlements`

**Itinerario**
- `GET /viajes/:viajeId/itinerario` · `POST /viajes/:viajeId/itinerario`
- `PUT /viajes/itinerario/:id` · `DELETE /viajes/itinerario/:id`

**Chat grupal (por tribu)**
- `GET /viajes/usuario/:id/chats` — chats grupales de todas las tribus de un usuario
- `GET /viajes/:viajeId/chat` · `POST /viajes/:viajeId/chat`
- `POST /viajes/:viajeId/chat/leido` · `GET /viajes/:viajeId/chat/estado?usuarioId=X`

**Chat 1 a 1**
- `GET /chats/usuario/:userId` · `POST /chats/invitar`
- `GET /chats/:chatId/mensajes` · `POST /chats/:chatId/mensajes` · `POST /chats/:chatId/leido`

## Troubleshooting

**"Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

**"JWT_SECRET no está definido"** — falta el `.env`, o le falta esa variable. Revisá que exista en la raíz del proyecto y reiniciá el servidor.

**"Port 3000 already in use"** — cambiá `PORT` en el `.env`, o cerrá el proceso que ya está usando ese puerto.

**Cambié el schema.prisma y algo no coincide** — corré `npx prisma migrate dev` de nuevo para generar y aplicar la migración correspondiente.

**Nota:** `prisma/dev.db` y el cliente generado de Prisma no están versionados en el repo — cada quien los genera localmente con los pasos de arriba.
