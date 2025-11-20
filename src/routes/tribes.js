import { PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const router = express.Router();
const prisma = new PrismaClient();



const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, Date.now() + "-" + safe);
  },
});

const upload = multer({ storage });


router.post("/", upload.single("imagen"), async (req, res) => {
  try {

    console.log("POST /tribes body fields:", req.body);
    console.log("POST /tribes file:", req.file);

    const { nombre, descripcion, fechaInicio, fechaFin, ubicacion, creadorId} = req.body;

    if (!nombre || !ubicacion) {
      return res.status(400).json({ error: "Complete los campos requeridos" });
    }
    if (!creadorId || Number.isNaN(Number(creadorId))) {
      return res.status(400).json({ error: "creadorId inválido" });
    }

    const parseFecha = (f) => {
      if (!f) return null;
      const partes = f.split("/");
      if (partes.length !== 3) return null;
      const [dd, mm, yyyy] = partes;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    };


    const filename = req.file?.filename || null;
    const webPath  = filename ? `/uploads/${filename}` : null;

    const nuevaTribu = await prisma.viaje.create({
      data: {
        nombre,
        descripcion,
        fechaInicio: parseFecha(fechaInicio),
        fechaFin: parseFecha(fechaFin),
        ubicacion,
        creadorId: Number(creadorId),
        imagen: webPath, // <-- siempre ruta web /uploads/...

       
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

    const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.status(201).json({
    ...nuevaTribu,
    imagenUrl: nuevaTribu.imagen ? `${baseURL}${nuevaTribu.imagen}` : null,
});
  } catch (error) {
    console.error("❌ Error detallado:", error);
    res.status(500).json({ error: "Error al crear la tribu" });
  }
});

router.use((err, req, res, next) => {
  if (err) {
    console.error("Multer/route error:", err);
    return res.status(400).json({ error: "Falló la subida de archivo", detalle: String(err) });
  }
  next();
});

export default router;
