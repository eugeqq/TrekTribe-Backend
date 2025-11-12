import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

router.get("/:id", async (req, res) => {
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, fechaNacimiento, dni, apodo, avatarUri } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        nombre,
        apellido,
        telefono,
        fechaNacimiento,
        dni,
        avatarUri,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});
export default router;