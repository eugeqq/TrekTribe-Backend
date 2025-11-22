import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import upload from "../middleware/upload.js";
import cloudinary from "../utils/cloudinary.js";

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

router.put("/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, fechaNacimiento, dni, apodo, } = req.body;

    let avatarUri= null;

   if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "trektribe/users",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // ENVIAR el buffer del archivo a Cloudinary
        stream.end(req.file.buffer);
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