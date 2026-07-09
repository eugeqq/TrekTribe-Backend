import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import validator from "validator";
import upload from "../middleware/upload";
import cloudinary from "../utils/cloudinary";

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

router.get("/email/:email", async (req, res) => {
  const  email = req.params.email;
  const normalizedEmail = email.trim().toLowerCase();
      if (!validator.isEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Email inválido" });
      }
  try {
    const user = await prisma.user.findUnique({
      where: { email: String(normalizedEmail) },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, fechaNacimiento, dni } = req.body;

    let avatarUri = null as any;

    if ((req as any).file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            asset_folder: "trektribe/users",
            resource_type: "image",
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end((req as any).file.buffer);
      });

      avatarUri = uploadResult.secure_url;
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        nombre,
        apellido,
        telefono,
        fechaNacimiento,
        dni,
        ...(avatarUri && { avatarUri }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

export default router;
