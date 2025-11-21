// routes/viajes.js
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();
const getBaseURL = () =>
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

router.get("/usuario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

   
    const viajes = await prisma.viaje.findMany({
      where: {
        miembros: {
          some: { usuarioId: userId },
        },
      },
      include: {
        miembros: {
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    const base = getBaseURL();
    const data = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      descripcion: v.descripcion,
      ubicacion: v.ubicacion,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      imagen: v.imagen,
      imagenUrl: v.imagen ? `${base}${v.imagen}` : null,
      miembrosCant: v.miembros.length,
      miembrosNombres: v.miembros.map((m) => `${m.usuario.nombre} ${m.usuario.apellido}`),
    }));

    res.json(data);
  } catch (error) {
    console.error("Error al obtener viajes del usuario:", error);
    res.status(500).json({ error: "Error al obtener viajes del usuario" });
  }
});

// GET /viajes/:userId  -> viajes donde es creador o miembro
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        OR: [
          { creadorId: Number(userId) },
          { miembros: { some: { usuarioId: Number(userId) } } },
        ],
      },
      include: {
        miembros: { include: { usuario: true } },
      },
      orderBy: { id: "desc" },
    });

    const base = getBaseURL();
    const viajesFormateados = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      ubicacion: v.ubicacion,
      descripcion: v.descripcion ?? "",
      foto: v.imagen ?? "",
      imagen: v.imagen,
      imagenUrl: v.imagen ? `${base}${v.imagen}` : null,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      miembrosCant: v.miembros.length,
      miembrosNombres: v.miembros.map((m) => `${m.usuario.nombre} ${m.usuario.apellido}`),
    }));

    res.json(viajesFormateados);
  } catch (error) {
    console.error("Error en GET /viajes/:userId", error);
    res.status(500).json({ error: "Error al obtener viajes" });
  }
});


router.get("/:viajeId/participantes", async (req, res) => {
  const { viajeId } = req.params;
  try {
    const miembros = await prisma.miembroViaje.findMany({
      where: { viajeId: Number(viajeId) },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, avatarUri: true } },
      },
    });

    const participantes = miembros.map((m) => ({
      id: String(m.usuario.id),
      name: `${m.usuario.nombre} ${m.usuario.apellido}`,
      avatar: m.usuario.avatarUri ?? null,
      rol: m.rol,
      miembroId: m.id,
      usuarioId: m.usuario.id,
    }));

    res.json(participantes);
  } catch (error) {
    console.error("Error en GET /viajes/:viajeId/participantes", error);
    res.status(500).json({ error: "Error al obtener participantes" });
  }
});

// GET /viajes/:viajeId/gastos -> gastos pertenecientes al viaje
router.get("/:viajeId/gastos", async (req, res) => {
  const { viajeId } = req.params;
  try {
    const gastos = await prisma.gasto.findMany({
      where: { viajeId: Number(viajeId) },
      include: {
        pagadoPor: { select: { id: true, nombre: true, apellido: true } },
        participantes: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { creadoEn: "desc" },
    });

    
    const gastosFormateados = gastos.map((g) => ({
      id: String(g.id),
      title: g.descripcion ?? "Gasto",
      description: g.descripcion ?? "",
      amount: Number(g.monto),
      payerId: String(g.pagadoPorId),
      payerName: g.pagadoPor ? `${g.pagadoPor.nombre} ${g.pagadoPor.apellido}` : null,
      createdAt: g.creadoEn,
      category: g.categoria ?? null,
      participants: g.participantes.map((p) => String(p.id)),
    }));

    res.json(gastosFormateados);
  } catch (error) {
    console.error("Error en GET /viajes/:viajeId/gastos", error);
    res.status(500).json({ error: "Error al obtener gastos del viaje" });
  }
});

router.get("/detalle/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const viaje = await prisma.viaje.findUnique({
      where: { id: parseInt(id) },
      include: {
        miembros: {
          include: {
            usuario: true,
          },
        },
      },
    });
    if (!viaje) return res.status(404).json({ error: "Viaje no encontrado" });

    const miembrosParseados = viaje.miembros.map((m) => ({
      id: m.usuario.id,
      nombre: m.usuario.nombre,
    }));

    const base = getBaseURL();
    res.json({
      ...viaje,
      imagenUrl: viaje.imagen ? `${base}${viaje.imagen}` : null,
      miembrosCant: miembrosParseados.length,
      miembros: miembrosParseados
    });
  } catch (error) {
    console.error("Error al obtener viaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
