import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
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
export default router;