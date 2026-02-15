# TrekTribe Backend 🏔️

Backend de la aplicación **TrekTribe**, una plataforma para organizar y gestionar viajes en grupo. Construido con Express, TypeScript, Prisma y SQLite.

---

## 📋 Contenido

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
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


#### Configuración de Cloudinary (para imágenes):

1. Crea una cuenta en [Cloudinary.com](https://cloudinary.com/)
2. Ve a tu dashboard y copia:
   - Cloud Name
   - API Key
   - API Secret
3. Agrégalos al archivo `.env`

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

## 🗄️ Configuración de Base de Datos

### Modelos de Datos:

El proyecto incluye los siguientes modelos principales:

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuarios del sistema con autenticación |
| **Viaje** | Viajes creados por usuarios |
| **MiembroViaje** | Relación entre usuarios y viajes (rol: admin/miembro) |
| **Tarea** | Tareas asignadas dentro de viajes |
| **Gasto** | Registro de gastos y división de costos |
| **ChatMensaje** | Mensajes de chat dentro de viajes |
| **ItinerarioEvento** | Eventos planificados en el itinerario |
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
- `GET /gastos` - Listar gastos
- `POST /gastos` - Registrar gasto
- `PUT /gastos/:id` - Actualizar gasto
- `DELETE /gastos/:id` - Eliminar gasto

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
