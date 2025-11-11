import { PrismaClient } from "@prisma/client";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();


router.get("/usuario/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ error: "userId inválido" });

    const viajes = await prisma.viaje.findMany({
      where: {
        OR: [
          { creadorId: userId },
          { miembros: { some: { usuarioId: userId } } }, // pivote
        ],
      },
      select: {
        id: true,
        nombre: true,
        ubicacion: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        imagen: true,
        _count: { select: { miembros: true } }, // 👈 cuenta miembros desde la pivote
      },
      orderBy: { creadoEn: "desc" },
    });

    const list = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      ubicacion: v.ubicacion ?? "—",
      descripcion: v.descripcion ?? "",
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      foto: v.imagen ?? null,
      miembrosCant: v._count.miembros ?? 0,
    }));

    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar viajes" });
  }
});



router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const viaje = await prisma.viaje.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        ubicacion: true,
        imagen: true,
        miembros: {
          select: {
            id: true,           // id de la pivote
            rol: true,
            usuario: {          // 👈 vamos a User para traer nombre/apellido/avatar
              select: { id: true, nombre: true, apellido: true, avatarUri: true },
            },
          },
        },
        _count: { select: { miembros: true } },
      },
    });

    if (!viaje) return res.status(404).json({ error: "Viaje no encontrado" });

    const dto = {
      id: viaje.id,
      nombre: viaje.nombre,
      descripcion: viaje.descripcion ?? "",
      ubicacion: viaje.ubicacion ?? "—",
      fechaInicio: viaje.fechaInicio,
      fechaFin: viaje.fechaFin,
      foto: viaje.imagen ?? null,
      miembrosCant: viaje._count.miembros ?? 0,
      miembros: (viaje.miembros ?? []).map((m) => ({
        id: m.usuario?.id ?? m.id,                 // priorizamos id de usuario
        nombre: m.usuario?.nombre ?? "Miembro",    // lo que tu front necesita
        apellido: m.usuario?.apellido ?? "",
        avatarUri: m.usuario?.avatarUri ?? null,
        rol: m.rol,
      })),
    };

    res.json(dto);
  } catch (e) {
    console.error("[/viajes/:id] Error:", e);
    res.status(500).json({ error: "Error al obtener el viaje" });
  }
});


router.post("/:id/miembros", async (req, res) => {
  try {
    const viajeId = Number(req.params.id);
    if (Number.isNaN(viajeId)) return res.status(400).json({ error: "id inválido" });

    const { currentUserId, usuarioId, email, rol } = req.body;

    
    const viaje = await prisma.viaje.findUnique({
      where: { id: viajeId },
      select: {
        id: true,
        creadorId: true,
        miembros: {
          where: { usuarioId: Number(currentUserId) },
          select: { rol: true },
        },
      },
    });
    if (!viaje) return res.status(404).json({ error: "Viaje no encontrado" });

    const esCreador = viaje.creadorId === Number(currentUserId);
    const esAdmin = viaje.miembros.some((m) => m.rol === "admin");
    if (!esCreador && !esAdmin) return res.status(403).json({ error: "No autorizado" });

    let user = null;
    if (usuarioId) {
      user = await prisma.user.findUnique({ where: { id: Number(usuarioId) } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email: String(email) } });
    } else {
      return res.status(400).json({ error: "Enviá usuarioId o email" });
    }
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

   
    const existe = await prisma.miembroViaje.findFirst({
      where: { usuarioId: user.id, viajeId },
      select: { id: true },
    });
    if (existe) return res.status(409).json({ error: "El usuario ya es miembro" });

    
    await prisma.miembroViaje.create({
      data: { usuarioId: user.id, viajeId, rol: rol ?? "miembro" },
    });

   
    const detalle = await prisma.viaje.findUnique({
      where: { id: viajeId },
      select: {
        id: true,
        miembros: {
          select: {
            id: true,
            rol: true,
            usuario: { select: { id: true, nombre: true, apellido: true, avatarUri: true } },
          },
        },
        _count: { select: { miembros: true } },
      },
    });

    const miembros = (detalle.miembros ?? []).map((m) => ({
      id: m.usuario?.id ?? m.id,
      nombre: m.usuario?.nombre ?? "Miembro",
      apellido: m.usuario?.apellido ?? "",
      avatarUri: m.usuario?.avatarUri ?? null,
      rol: m.rol,
    }));

    res.status(201).json({ ok: true, miembrosCant: detalle._count.miembros ?? 0, miembros });
  } catch (e) {
    console.error("[POST /viajes/:id/miembros] Error:", e);
    res.status(500).json({ error: "Error al agregar miembro" });
  }
});

router.get("/:viajeId/itinerario", async (req, res) => {
  try {
    const viajeId = Number(req.params.viajeId);
    if (Number.isNaN(viajeId)) return res.status(400).json({ error: "viajeId inválido" });

    const rows = await prisma.itinerarioEvento.findMany({
      where: { viajeId },
      orderBy: { fechaHora: "asc" },
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar itinerario" });
  }
});

// POST /viajes/:viajeId/itinerario 
router.post("/:viajeId/itinerario", async (req, res) => {
  try {
    const viajeId = Number(req.params.viajeId);
    const { titulo, descripcion, fechaHora } = req.body;
    if (!titulo || !fechaHora) return res.status(400).json({ error: "Falta titulo o fechaHora" });

    const row = await prisma.itinerarioEvento.create({
      data: {
        viajeId,
        titulo,
        descripcion: descripcion ?? null,
        fechaHora: new Date(fechaHora),
      },
    });
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al crear evento" });
  }
});

// PUT /itinerario/:id
router.put("/itinerario/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, descripcion, fechaHora } = req.body;

    const row = await prisma.itinerarioEvento.update({
      where: { id },
      data: {
        titulo,
        descripcion: descripcion ?? null,
        fechaHora: new Date(fechaHora),
      },
    });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar evento" });
  }
});

// DELETE /itinerario/:id
router.delete("/itinerario/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.itinerarioEvento.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
});



export default router;
