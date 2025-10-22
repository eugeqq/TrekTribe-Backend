import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from "bcrypt";
import cors from 'cors';
import express from 'express';
import fs from "fs";
import multer from "multer";
import path from "path";

const prisma = new PrismaClient().$extends(withAccelerate())

const app = express()
app.use(cors())
app.use(express.json())

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext || ".jpg"}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

app.post("/register", async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  try {
    // 1️⃣ Validar campos
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // 2️⃣ Verificar si el email ya está registrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // 3️⃣ Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Crear el nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
      },
    });

    // 5️⃣ Responder sin exponer la contraseña
    res.status(201).json({
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      email: newUser.email,
      createdAt: newUser.createdAt,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error interno al registrar usuario" });
  }
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Buscar el usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    // 2️⃣ Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // 3️⃣ Responder con los datos del usuario
    res.status(200).json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`),
)
