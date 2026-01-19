import { PrismaClient } from "@prisma/client";
import express from "express";
import upload from "../middleware/upload";
import cloudinary from "../utils/cloudinary";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, descripcion, fechaInicio, fechaFin, ubicacion, creadorId } = req.body;

    if (!nombre || !ubicacion) {
      return res.status(400).json({ error: "Complete los campos requeridos" });
    }
    if (!creadorId || Number.isNaN(Number(creadorId))) {
      return res.status(400).json({ error: "creadorId inválido" });
    }

    const parseFecha = (f: string | undefined) => {
      if (!f) return null;
      const partes = f.split("/");
      if (partes.length !== 3) return null;
      const [dd, mm, yyyy] = partes;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    };

    let imagenUrl = null as string | null;

    if ((req as any).file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "trektribe/tribes",
            resource_type: "image",
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end((req as any).file.buffer);
      });
      

      imagenUrl = uploadResult.secure_url;
    }

    const nuevaTribu = await prisma.viaje.create({
      data: {
        nombre,
        descripcion,
        fechaInicio: parseFecha(fechaInicio),
        fechaFin: parseFecha(fechaFin),
        ubicacion,
        creadorId: Number(creadorId),
        imagen: imagenUrl,
        miembros: {
          create: [
            {
              usuario: { connect: { id: Number(creadorId) } },
              rol: "admin",
            },
          ],
        },
      },
      select: {
        id: true,
        nombre: true,
        ubicacion: true,
        imagen: true,
        creadorId: true,
      },
    });

    res.status(201).json(nuevaTribu);
  } catch (error) {
    console.error("❌ Error detallado:", error);
    res.status(500).json({ error: "Error al crear la tribu" });
  }
});

router.use((err: any, req: any, res: any, next: any) => {
  if (err) {
    console.error("Multer/route error:", err);
    return res.status(400).json({ error: "Falló la subida de archivo", detalle: String(err) });
  }
  next();
});

export default router;
