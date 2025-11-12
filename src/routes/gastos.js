// routes/gastos.js
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /gastos
 * body: { monto, categoria, descripcion, pagadoPorId, viajeId, participants? }
 */
router.post("/", async (req, res) => {
  const { monto, categoria, descripcion, pagadoPorId, viajeId } = req.body;

  try {
    if (monto == null || !pagadoPorId || !viajeId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const nuevo = await prisma.gasto.create({
      data: {
        monto: Number(monto),
        categoria: categoria ?? null,
        descripcion: descripcion ?? null,
        pagadoPorId: Number(pagadoPorId),
        viajeId: Number(viajeId),
      },
      include: {
        pagadoPor: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.status(201).json({
      id: String(nuevo.id),
      title: nuevo.descripcion ?? "Gasto",
      amount: Number(nuevo.monto),
      payerId: String(nuevo.pagadoPorId),
      payerName: nuevo.pagadoPor ? `${nuevo.pagadoPor.nombre} ${nuevo.pagadoPor.apellido}` : null,
      createdAt: nuevo.creadoEn,
      category: nuevo.categoria ?? null,
      participants: [],
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
  const { monto, categoria, descripcion, pagadoPorId } = req.body;

  try {
    const updated = await prisma.gasto.update({
      where: { id: Number(id) },
      data: {
        monto: monto != null ? Number(monto) : undefined,
        categoria: categoria ?? undefined,
        descripcion: descripcion ?? undefined,
        pagadoPorId: pagadoPorId != null ? Number(pagadoPorId) : undefined,
      },
      include: {
        pagadoPor: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.json({
      id: String(updated.id),
      title: updated.descripcion ?? "Gasto",
      amount: Number(updated.monto),
      payerId: String(updated.pagadoPorId),
      payerName: updated.pagadoPor ? `${updated.pagadoPor.nombre} ${updated.pagadoPor.apellido}` : null,
      createdAt: updated.creadoEn,
      category: updated.categoria ?? null,
      participants: [],
    });
  } catch (error) {
    console.error("Error PUT /gastos/:id", error);
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
});

/**
 * DELETE /gastos/:id
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.gasto.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error DELETE /gastos/:id", error);
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
});

export default router;

/*import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();


router.get("/:viajeId", async (req, res) => {
  const { viajeId } = req.params;

  try {
    const gastos = await prisma.gasto.findMany({
      where: { viajeId: parseInt(viajeId) },
      include: {
        pagadoPor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    res.json(gastos);
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    res.status(500).json({ error: "Error interno al obtener los gastos" });
  }
});


router.post("/", async (req, res) => {
  const { monto, categoria, descripcion, pagadoPorId, viajeId } = req.body;

  try {
    if (!monto || !pagadoPorId || !viajeId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const nuevoGasto = await prisma.gasto.create({
      data: {
        monto: parseFloat(monto),
        categoria,
        descripcion,
        pagadoPorId: parseInt(pagadoPorId),
        viajeId: parseInt(viajeId),
      },
      include: {
        pagadoPor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    res.status(201).json(nuevoGasto);
  } catch (error) {
    console.error("Error al crear gasto:", error);
    res.status(500).json({ error: "Error interno al crear gasto" });
  }
});

router.get("/usuario/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const gastos = await prisma.gasto.findMany({
      where: { pagadoPorId: parseInt(userId) },
      include: {
        viaje: { select: { id: true, nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
    });

    res.json(gastos);
  } catch (error) {
    console.error("Error obteniendo gastos de usuario:", error);
    res.status(500).json({ error: "Error interno al obtener los gastos" });
  }
});

export default router;*/