import { PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.post("/", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, descripcion, fechaInicio, fechaFin, ubicacion, creadorId } = req.body;

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

    const nuevaTribu = await prisma.viaje.create({
      data: {
        nombre,
        descripcion,
        fechaInicio: parseFecha(fechaInicio),
        fechaFin: parseFecha(fechaFin),
        ubicacion,
        creadorId: Number(creadorId),
        imagen: req.file ? req.file.path : null,

       
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

export default router;
