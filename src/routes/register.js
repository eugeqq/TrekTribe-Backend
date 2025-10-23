import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { nombre, apellido, email, password } = req.body;

  try {
    
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
      },
    });

    
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