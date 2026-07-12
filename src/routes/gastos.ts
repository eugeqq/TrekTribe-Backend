import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { fullName, NOMBRE_APELLIDO_SELECT } from "../utils/format";
import { esMiembroDelViaje } from "../utils/permissions";
import prisma from "../utils/prisma";

const router = Router();

router.use(requireAuth);

/**
 * POST /gastos
 * body: { monto, categoria, descripcion, pagadoPorId, viajeId, participants? }
 */
router.post("/", async (req, res) => {
  try {
    const { monto, categoria, descripcion, pagadoPorId, viajeId, participantes } = req.body;

    if (monto == null || !pagadoPorId || !viajeId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({ error: "Faltan participantes" });
    }

    const nuevo = await prisma.gasto.create({
      data: {
        monto: Number(monto),
        categoria: categoria ?? null,
        descripcion: descripcion ?? null,
        pagadoPorId: Number(pagadoPorId),
        viajeId: Number(viajeId),
        participantes: {
          connect: participantes.map((id: any) => ({ id: Number(id) })),
        },
      },
      include: {
        pagadoPor: { select: NOMBRE_APELLIDO_SELECT },
        participantes: { select: NOMBRE_APELLIDO_SELECT },
      },
    });

    res.status(201).json({
      id: String(nuevo.id),
      title: nuevo.descripcion ?? "Gasto",
      amount: Number(nuevo.monto),
      payerId: String(nuevo.pagadoPorId),
      payerName: fullName(nuevo.pagadoPor),
      createdAt: nuevo.creadoEn,
      category: nuevo.categoria ?? null,
      participants: nuevo.participantes.map((p) => String(p.id)),
    });
  } catch (error) {
    console.error("Error POST /gastos", error);
    res.status(500).json({ error: "Error al crear gasto" });
  }
});

/**
 * PUT /gastos/:id
 * body: { monto, categoria, descripcion, pagadoPorId }
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { monto, categoria, descripcion, pagadoPorId, participantes } = req.body;

  if (monto != null && (!Number.isFinite(Number(monto)) || Number(monto) <= 0)) {
    return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
  }
  if (participantes != null && !Array.isArray(participantes)) {
    return res.status(400).json({ error: "participantes debe ser una lista" });
  }

  try {
    const updated = await prisma.gasto.update({
      where: { id: Number(id) },
      data: {
        monto: monto != null ? Number(monto) : undefined,
        categoria: categoria ?? undefined,
        descripcion: descripcion ?? undefined,
        pagadoPorId: pagadoPorId != null ? Number(pagadoPorId) : undefined,
        ...(participantes != null && {
          participantes: { set: participantes.map((id: any) => ({ id: Number(id) })) },
        }),
      },
      include: {
        pagadoPor: { select: NOMBRE_APELLIDO_SELECT },
        participantes: { select: NOMBRE_APELLIDO_SELECT },
      },
    });

    res.json({
      id: String(updated.id),
      title: updated.descripcion ?? "Gasto",
      amount: Number(updated.monto),
      payerId: String(updated.pagadoPorId),
      payerName: fullName(updated.pagadoPor),
      createdAt: updated.creadoEn,
      category: updated.categoria ?? null,
      participants: updated.participantes.map((p) => String(p.id)),
    });
  } catch (error) {
    console.error("Error PUT /gastos/:id", error);
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
});

/**
 * DELETE /gastos/:id
 */
router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const gasto = await prisma.gasto.findUnique({ where: { id: Number(id) }, select: { viajeId: true } });
    if (!gasto) return res.status(404).json({ error: "Gasto no encontrado" });
    if (!(await esMiembroDelViaje(gasto.viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    await prisma.gasto.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error DELETE /gastos/:id", error);
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
});

export default router;
