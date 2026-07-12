import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

async function esMiembroDelViaje(viajeId: number, usuarioId: number): Promise<boolean> {
  const viaje = await prisma.viaje.findUnique({ where: { id: viajeId }, select: { creadorId: true } });
  if (!viaje) return false;
  if (viaje.creadorId === usuarioId) return true;
  const miembro = await prisma.miembroViaje.findFirst({
    where: { viajeId, usuarioId },
    select: { id: true },
  });
  return !!miembro;
}

// ✅ GET /viajes/:viajeId/tareas → listar tareas del viaje
router.get("/viajes/:viajeId/tareas", requireAuth, async (req: AuthRequest, res) => {
  const { viajeId } = req.params;
  try {
    if (!(await esMiembroDelViaje(Number(viajeId), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const tareas = await prisma.tarea.findMany({
      where: { viajeId: Number(viajeId) },
      include: { responsable: true },
      orderBy: { id: "desc" },
    });
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener las tareas" });
  }
});

// ✅ POST /viajes/:viajeId/tareas → crear tarea nueva
router.post("/viajes/:viajeId/tareas", requireAuth, async (req: AuthRequest, res) => {
  const { viajeId } = req.params;
  const { titulo, descripcion, estado, responsableId } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: "El título es obligatorio" });
  }

  try {
    if (!(await esMiembroDelViaje(Number(viajeId), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const tarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        estado: estado || "pendiente",
        responsableId: responsableId ? Number(responsableId) : null,
        viajeId: Number(viajeId),
      },
    });
    res.status(201).json(tarea);
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ error: "Error al crear la tarea" });
  }
});

// ✅ PUT /tareas/:id → editar tarea
router.put("/tareas/:id", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { titulo, descripcion, estado, responsableId } = req.body;

  try {
    const existente = await prisma.tarea.findUnique({ where: { id: Number(id) }, select: { viajeId: true } });
    if (!existente) return res.status(404).json({ error: "Tarea no encontrada" });
    if (!(await esMiembroDelViaje(existente.viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const tarea = await prisma.tarea.update({
      where: { id: Number(id) },
      data: {
        titulo,
        descripcion,
        estado,
        responsableId: responsableId ? Number(responsableId) : null,
      },
    });
    res.json(tarea);
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ error: "Error al actualizar la tarea" });
  }
});

// ✅ DELETE /tareas/:id → eliminar tarea
router.delete("/tareas/:id", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const existente = await prisma.tarea.findUnique({ where: { id: Number(id) }, select: { viajeId: true } });
    if (!existente) return res.status(404).json({ error: "Tarea no encontrada" });
    if (!(await esMiembroDelViaje(existente.viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    await prisma.tarea.delete({ where: { id: Number(id) } });
    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ error: "Error al eliminar la tarea" });
  }
});

export default router;
