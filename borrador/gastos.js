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
  console.log("🟢 POST /gastos llamado");
  console.log("Body recibido:", req.body);

  try {
     const { monto, categoria, descripcion, pagadoPorId, viajeId, participantes } = req.body;

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
        participantes: {
          connect: participantes.map((id) => ({ id: Number(id) })), // ← relación muchos-a-muchos
        },
      },
      include: {
        pagadoPor: { select: { id: true, nombre: true, apellido: true } },
        participantes: { select: { id: true, nombre: true, apellido: true } },
      },
    });
    console.log("✅ Gasto creado correctamente:", {
      id: nuevo.id,
      descripcion: nuevo.descripcion,
      participantes: nuevo.participantes.map((p) => p.id),
    });

    res.status(201).json({
        id: String(nuevo.id),
        title: nuevo.descripcion ?? "Gasto",
        amount: Number(nuevo.monto),
        payerId: String(nuevo.pagadoPorId),
        payerName: nuevo.pagadoPor ? `${nuevo.pagadoPor.nombre} ${nuevo.pagadoPor.apellido}` : null,
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
  const { monto, categoria, descripcion, pagadoPorId } = req.body;

  try {
    const updated = await prisma.gasto.update({
      where: { id: Number(id) },
      data: {
        monto: monto != null ? Number(monto) : undefined,
        categoria: categoria ?? undefined,
        descripcion: descripcion ?? undefined,
        pagadoPorId: pagadoPorId != null ? Number(pagadoPorId) : undefined,
        participantes: {
          set: participantes.map((id) => ({ id: Number(id) })), // reemplaza relaciones anteriores
        },
      },
      include: {
        pagadoPor: { select: { id: true, nombre: true, apellido: true } },
        participantes: { select: { id: true, nombre: true, apellido: true } },
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
