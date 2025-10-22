import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();


router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

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
      email: user.email,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});

export default router;