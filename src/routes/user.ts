import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import validator from "validator";
import { AuthRequest, requireAuth } from "../middleware/auth";
import upload from "../middleware/upload";
import cloudinary from "../utils/cloudinary";

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// Selección explícita: nunca devolver el hash de la contraseña al cliente.
const PUBLIC_USER_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  fechaNacimiento: true,
  dni: true,
  avatarUri: true,
  creadoAt: true,
};

router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: PUBLIC_USER_SELECT,
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
      select: PUBLIC_USER_SELECT,
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/:id", upload.single("avatar"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== Number(id)) {
      return res.status(403).json({ error: "No autorizado" });
    }

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
      select: PUBLIC_USER_SELECT,
    });

    res.json(user);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

export default router;
