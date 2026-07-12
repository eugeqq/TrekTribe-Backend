import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import validator from "validator";

const router = Router();
const prisma = new PrismaClient();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 registros por IP
  message: "Demasiados intentos de registro. Inténtalo de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", registerLimiter, async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  try {
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      email: newUser.email,
      createdAt: newUser.creadoAt,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error interno al registrar usuario" });
  }
});
export default router;
