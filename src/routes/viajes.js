import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// Obtener todos los viajes
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    console.log("Llega userId:", userId);
    try {
        const viajes = await prisma.viaje.findMany({
        where: {
            OR: [
                { creadorId: Number(userId) },
                { miembros: { some: { usuarioId: Number(userId) } } },
            ],
        },
        include: {
            miembros: {
                include: {
                    usuario: {
                         select: { id: true, nombre: true, apellido: true, avatarUri: true },
                    },
                },
            },
        },
        orderBy: { id: "desc" },
    });
    const viajesFormateados = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      ubicacion: v.ubicacion,
      descripcion: v.descripcion ?? "",
      foto: v.imagen ?? "",
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      miembrosCant: v.miembros.length,
      miembrosNombres: v.miembros.map(
        (m) => `${m.usuario.nombre} ${m.usuario.apellido}`
      ),
    }));

    res.json(viajesFormateados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los viajes" });
  }
});

export default router;
