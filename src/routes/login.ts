import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import validator from "validator";

const JWT_SECRET = process.env.JWT_SECRET || "tu-secret-key-segura";


const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    console.log("[LOGIN] request body:", { email, password: password ? "****" : null });
    const user = await prisma.user.findUnique({ where: {  email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    
    }
    console.log("[LOGIN] user found:", { id: user.id, email: user.email });
    

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    console.log("[LOGIN] response payload:", { id: user.id, nombre: user.nombre, email: user.email, tokenLength: token?.length ?? 0 });

    res.status(200).json({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      token, // Retorna el token
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});


// Validar token
router.post("/validate-session", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, error: "Token requerido" });
  }
  console.log("[VALIDATE] body:", req.body);
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    console.log("[VALIDATE] decoded:", decoded);
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: { id: true, email: true, nombre: true, apellido: true },
    });

    if (!user) {
      return res.status(401).json({ valid: false, error: "Usuario no encontrado" });
    }

    res.status(200).json({ valid: true, user });
  } catch (error) {
    console.error("[VALIDATE] jwt error:", error);
    res.status(401).json({ valid: false, error: "Token inválido o expirado" });
  }
});

export default router;
