# TrekTribe Backend 🏔️

Backend de la aplicación **TrekTribe**, una plataforma para organizar y gestionar viajes en grupo. Construido con Express, TypeScript, Prisma y SQLite.

---

## 📋 Contenido

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Guía: conectar tu propia cuenta de Cloudinary](#☁️-guía-conectar-tu-propia-cuenta-de-cloudinary)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Cómo Levantar el Servidor](#cómo-levantar-el-servidor)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Endpoints Principales](#endpoints-principales)
- [Troubleshooting](#troubleshooting)

---

## 📖 Descripción del Proyecto

TrekTribe es una aplicación backend que permite a los usuarios:
- 🔐 Registrarse y autenticarse
- 🗺️ Crear y gestionar viajes
- 👥 Invitar miembros
- ✅ Asignar tareas dentro de los viajes
- 💰 Registrar y dividir gastos
- 📅 Crear itinerarios de eventos

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
- **npm** >= 9.x (viene con Node.js)
- **Git** (para clonar el repositorio)
- **SQLite** (ya incluido, no requiere instalación adicional)

Para verificar las versiones instaladas:

```bash
node --version
npm --version
```

---

## 📥 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/eugeqq/TrekTribe-Backend
cd TrekTribe-Backend
```

### 2. Instalar dependencias

```bash
npm install
```

Este comando instala todas las dependencias especificadas en `package.json`, incluyendo:
- Express.js
- Prisma ORM
- TypeScript
- Cloudinary SDK
- JWT (jsonwebtoken)
- Multer (para manejo de archivos)
- Y más...

### 3. Configurar variables de entorno

Crea un archivo `.env` en la **raíz del proyecto** y añade las siguientes variables:

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Puerto del servidor
PORT=3000

# Secreto JWT para autenticación
JWT_SECRET=tu_secreto_super_seguro_aqui

# Cloudinary (para subida de imágenes)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> La guía detallada para obtener estos tres valores de Cloudinary está más abajo, en [Guía: conectar tu propia cuenta de Cloudinary](#☁️-guía-conectar-tu-propia-cuenta-de-cloudinary).

### 4. Configurar la Base de Datos

La aplicación usa **Prisma ORM** con **SQLite**. Para crear las tablas:

```bash
npx prisma migrate dev
```

Este comando:
- Crea el archivo `prisma/dev.db` (la base de datos SQLite)
- Ejecuta todas las migraciones pendientes
- Genera el Prisma Client automáticamente


---

## 🌍 Variables de Entorno

### Obligatorias:
- `DATABASE_URL` - URL de conexión a la base de datos
- `PORT` - Puerto en el que corre el servidor (default: 3000)
- `JWT_SECRET` - Secreto para firmar tokens JWT

### Opcionales (pero recomendadas):
- `CLOUDINARY_CLOUD_NAME` - Cloud name de Cloudinary
- `CLOUDINARY_API_KEY` - API Key de Cloudinary
- `CLOUDINARY_API_SECRET` - API Secret de Cloudinary
- `BASE_URL` - URL base de la aplicación para requests

---

## ☁️ Guía: conectar tu propia cuenta de Cloudinary

Cloudinary es el servicio que usa el backend para guardar las imágenes (avatares de usuario y fotos de tribu/viaje). Sin credenciales válidas, la subida de imágenes falla (aunque el resto de la app funcione bien). Seguí estos pasos con tu propia cuenta:

### 1. Crear la cuenta

1. Andá a [cloudinary.com](https://cloudinary.com/users/register/free) y creá una cuenta gratuita (el plan Free alcanza de sobra para este proyecto).
2. Confirmá el email si te lo pide.

### 2. Copiar las credenciales al `.env`

1. Entrá al [Dashboard](https://console.cloudinary.com/) de Cloudinary.
2. En la parte superior vas a ver **Product Environment Credentials** (o el panel "Account Details"), con tres datos:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (tocá el ícono del ojo o "Reveal" para verlo, y usá el botón de copiar — no lo tipees a mano, es fácil recortarlo por error)
3. Pegalos en el `.env` del backend:
   ```env
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```
4. Reiniciá el servidor (`npm run dev`) para que tome las nuevas variables.

### 3. Usá la API Key "Root" (importante)

Cloudinary permite crear API Keys adicionales con permisos restringidos (por ejemplo, para subida sin poder borrar, o limitadas a ciertas carpetas). Si usás una de esas keys en vez de la key raíz de la cuenta, vas a ver errores `403 Server returned unexpected status code` al subir imágenes aunque las credenciales sean "correctas".

Para evitarlo:
1. En el Dashboard, andá a **Settings → API Keys** (o `console.cloudinary.com/settings/api-keys`).
2. Usá la key marcada como **Root** (la que se crea por defecto con la cuenta), no una key secundaria/generada.

### 4. Modo de carpetas ("Dynamic Folder Mode")

Las cuentas nuevas de Cloudinary vienen por defecto en **Dynamic Folder Mode**. Esto cambia cómo se especifica la carpeta destino al subir una imagen:

- ❌ Parámetro viejo (Fixed Folder Mode): `folder: "trektribe/users"`
- ✅ Parámetro correcto (Dynamic Folder Mode): `asset_folder: "trektribe/users"`

El código de este proyecto (`src/routes/user.ts` y `src/routes/tribes.ts`) ya usa `asset_folder`, así que si tu cuenta es nueva (lo más probable) **no tenés que tocar nada**. Esto solo importa si en algún momento cambiás el modo de carpetas de tu cuenta en Cloudinary Settings → Upload, o si copiás este código a otro proyecto con una cuenta más vieja en Fixed Folder Mode.

### 5. Verificar que funciona

1. Con el backend corriendo y el `.env` actualizado, abrí la app, entrá a **Perfil** y subí una foto (o creá una tribu con imagen).
2. Si sale bien, la imagen va a aparecer subida dentro de `Media Library` en el dashboard de Cloudinary, en la carpeta `trektribe/users` o `trektribe/tribes`.

### Errores comunes

| Error | Causa típica | Solución |
|---|---|---|
| `Invalid Signature` | El `CLOUDINARY_API_SECRET` está mal copiado (truncado o con espacios) | Volvé a copiarlo con el botón de copiar del dashboard, no lo tipees a mano |
| `403 Server returned unexpected status code` | Estás usando una API Key restringida, no la Root | Usá la key Root de la cuenta (paso 3) |
| `403` con cuentas antiguas | Modo de carpetas Fixed en vez de Dynamic | Revisá que el parámetro sea `asset_folder`, no `folder` (paso 4) |
| Error genérico al subir avatar/imagen | Faltan las variables de entorno o el servidor no se reinició | Confirmá que las 3 variables estén en `.env` y reiniciá `npm run dev` |

---

## 🗄️ Configuración de Base de Datos

### Modelos de Datos:

El proyecto incluye los siguientes modelos principales:

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuarios del sistema con autenticación |
| **Viaje** | Viajes creados por usuarios |
| **MiembroViaje** | Relación entre usuarios y viajes (rol: admin/miembro). También guarda `chatLeidoEn`, la última vez que ese usuario abrió el chat grupal del viaje |
| **Tarea** | Tareas asignadas dentro de viajes |
| **Gasto** | Registro de gastos y división de costos |
| **Settlement** | Pagos que saldan deudas entre miembros de un viaje ("Saldar Cuentas") |
| **ChatMensaje** | Mensajes del chat grupal de un viaje/tribu: todos sus miembros comparten un único chat |
| **Chat** / **MensajeChatPrivado** | Chat 1 a 1 entre dos usuarios, con invitación por email |
| **ItinerarioEvento** | Eventos planificados en el itinerario (con ubicación → link a Google Maps) |
| **Todo** | Tareas personales de usuarios |

Para ver la estructura completa, abre [prisma/schema.prisma](prisma/schema.prisma).

### Generar Prisma Client:

```bash
npx prisma generate
```

### Ver/Editar datos con Prisma Studio:

```bash
npx prisma studio
```

Esto abre una interfaz visual en `http://localhost:5555` para gestionar los datos.

---

## 🚀 Cómo Levantar el Servidor

### Modo Desarrollo (recomendado)

```bash
npm run dev
```

El servidor escuchará en: **http://localhost:3000** (o tu IP local)

Las características del modo desarrollo:
- ✅ Recarga automática al cambiar archivos
- ✅ TypeScript compilado en tiempo real
- ✅ Mensajes de error más descriptivos

### Modo Producción

Primero compila el código:

```bash
npm run build
```

Luego inicia el servidor:

```bash
npm start
```

---


## 📁 Estructura del Proyecto

```
TrekTribe-Backend/
├── src/
│   ├── server.ts              # Punto de entrada
│   ├── app.ts                 # Configuración de Express
│   ├── middleware/
│   │   ├── auth.ts            # Middleware de autenticación JWT
│   │   └── upload.ts          # Middleware para subida de archivos
│   ├── routes/
│   │   ├── login.ts           # Ruta de login
│   │   ├── register.ts        # Ruta de registro
│   │   ├── user.ts            # Rutas de usuario
│   │   ├── viajes.ts          # Rutas de viajes
│   │   ├── tareas.ts          # Rutas de tareas
│   │   ├── gastos.ts          # Rutas de gastos
│   │   ├── todo.ts            # Rutas de todos
│   │   └── tribes.ts          # Rutas de tribos/grupos
│   └── utils/
│       ├── asyncHandler.ts    # Envolvedor para async/await
│       └── cloudinary.ts      # Configuración de Cloudinary
├── prisma/
│   ├── schema.prisma          # Definición de modelos
│   ├── dev.db                 # Base de datos SQLite (generada)
│   └── migrations/            # Historial de migraciones
├── uploads/                   # Carpeta para archivos temporales
├── package.json               # Dependencias del proyecto
├── tsconfig.json              # Configuración de TypeScript
├── eslint.config.js           # Configuración de linting
└── README.md                  # Este archivo
```

---

## 🔧 Tecnologías Utilizadas

| Tecnología | Descripción |
|------------|-------------|
| **Node.js** | Runtime de JavaScript |
| **Express.js** | Framework web minimalista |
| **TypeScript** | Tipado estático para JavaScript |
| **Prisma ORM** | ORM moderno para bases de datos |
| **SQLite** | Base de datos relacional |
| **JWT** | Autenticación con tokens JSON Web Token |
| **Bcrypt** | Hash de contraseñas |
| **Cloudinary** | Servicio de almacenamiento de imágenes |
| **Multer** | Middleware para subida de archivos |
| **CORS** | Manejo de solicitudes cross-origin |
| **ts-node-dev** | Ejecución de TypeScript en desarrollo |

---

## 🔌 Endpoints Principales

### Autenticación
- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión

### Usuarios
- `GET /user` - Obtener info del usuario (requiere autenticación)
- `PUT /user` - Actualizar perfil
- `GET /user/:id` - Obtener usuario por ID

### Viajes
- `GET /viajes` - Listar todos los viajes
- `POST /viajes` - Crear viaje
- `GET /viajes/:id` - Obtener detalles del viaje
- `PUT /viajes/:id` - Actualizar viaje
- `DELETE /viajes/:id` - Eliminar viaje

### Tareas
- `GET /tareas` - Listar tareas
- `POST /tareas` - Crear tarea
- `PUT /tareas/:id` - Actualizar tarea
- `DELETE /tareas/:id` - Eliminar tarea

### Gastos
- `GET /viajes/:viajeId/gastos` - Listar gastos de un viaje
- `POST /gastos` - Registrar gasto
- `PUT /gastos/:id` - Actualizar gasto
- `DELETE /gastos/:id` - Eliminar gasto

### Saldar cuentas (Settlements)
- `GET /viajes/:viajeId/settlements` - Listar pagos que saldan deudas del viaje
- `POST /viajes/:viajeId/settlements` - Registrar un pago entre dos miembros

### Chat grupal por tribu
Todos los miembros de un viaje comparten un único chat (no requiere invitación: entrás automáticamente al ser miembro del viaje).
- `GET /viajes/usuario/:id/chats` - Listar, para un usuario, los chats grupales de todas sus tribus (con preview y estado "no leído")
- `GET /viajes/:viajeId/chat` - Historial de mensajes del chat grupal del viaje
- `POST /viajes/:viajeId/chat` - Enviar un mensaje al chat grupal
- `POST /viajes/:viajeId/chat/leido` - Marcar el chat grupal como leído
- `GET /viajes/:viajeId/chat/estado?usuarioId=X` - Consulta liviana de si hay mensajes sin leer (para el puntito de "no leído")

### Chats privados (1 a 1)
- `GET /chats/usuario/:userId` - Listar chats del usuario (con preview y estado "no leído")
- `POST /chats/invitar` - Iniciar (o reutilizar) un chat invitando por email
- `GET /chats/:chatId/mensajes` - Historial de mensajes de un chat
- `POST /chats/:chatId/mensajes` - Enviar un mensaje
- `POST /chats/:chatId/leido` - Marcar el chat como leído

> Consulta los archivos en `src/routes/` para ver todos los endpoints disponibles.

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
npm install
```

### Error: "Port 3000 already in use"

Cambia el puerto en el archivo `.env`:

```env
PORT=3001
```

### Error: "DATABASE_URL is not set"

Asegúrate de que el archivo `.env` existe y contiene:

```env
DATABASE_URL="file:./dev.db"
```

### Error: "EACCES: permission denied"

En macOS/Linux, intenta:

```bash
sudo npm install -g npm
npm install
```



## 📞 Soporte

Si encuentras problemas:

1. Verifica que Node.js y npm estén correctamente instalados
2. Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install`
3. Revisa que el archivo `.env` tenga todas las variables necesarias
4. Verifica los logs en la consola para mensajes de error

---


**¡Listo para comenzar!** 🚀

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
