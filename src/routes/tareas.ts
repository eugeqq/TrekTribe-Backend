import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// ✅ GET /viajes/:viajeId/tareas → listar tareas del viaje
router.get("/viajes/:viajeId/tareas", async (req, res) => {
  const { viajeId } = req.params;
  try {
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
router.post("/viajes/:viajeId/tareas", async (req, res) => {
  const { viajeId } = req.params;
  const { titulo, descripcion, estado, responsableId } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: "El título es obligatorio" });
  }

  try {
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
router.put("/tareas/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, estado, responsableId } = req.body;

  try {
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
router.delete("/tareas/:id", async (req, res) => {
  console.log('los parametros recibidos son', req.params);
  const { id } = req.params;
  console.log('id', id);
  try {
    await prisma.tarea.delete({ where: { id: Number(id) } });
    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ error: "Error al eliminar la tarea" });
  }
});

export default router;
