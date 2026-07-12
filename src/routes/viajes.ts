// routes/viajes.ts
import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { fullName, NOMBRE_APELLIDO_AVATAR_SELECT, NOMBRE_APELLIDO_SELECT } from "../utils/format";
import { esMiembroDelViaje } from "../utils/permissions";
import prisma from "../utils/prisma";

const router = Router();
const getBaseURL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

router.use(requireAuth);

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
              select: NOMBRE_APELLIDO_SELECT,
            },
          },
        },
      },
    });

    const data = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      descripcion: v.descripcion,
      ubicacion: v.ubicacion,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      imagen: v.imagen,
      imagenUrl: v.imagen ? v.imagen : null,
      miembrosCant: v.miembros.length,
      miembrosNombres: v.miembros.map((m) => fullName(m.usuario)),
    }));

    res.json(data);
  } catch (error) {
    console.error("Error al obtener viajes del usuario:", error);
    res.status(500).json({ error: "Error al obtener viajes del usuario" });
  }
});

// GET /viajes/usuario/:id/chats -> lista de chats grupales (uno por cada
// tribu de la que el usuario es miembro), con preview del último mensaje y
// estado de "no leído". Pensado para mostrarse junto a los chats 1 a 1 en
// la pantalla de Chats del frontend.
router.get("/usuario/:id/chats", async (req, res) => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) return res.status(400).json({ error: "ID de usuario inválido" });

  try {
    const miembros = await prisma.miembroViaje.findMany({
      where: { usuarioId: userId },
      select: {
        chatLeidoEn: true,
        viaje: {
          select: {
            id: true,
            nombre: true,
            imagen: true,
            mensajes: {
              orderBy: { enviadoEn: "desc" },
              take: 1,
              include: { usuario: { select: NOMBRE_APELLIDO_SELECT } },
            },
          },
        },
      },
    });

    const data = miembros.map((m) => {
      const v = m.viaje;
      const ultimo = v.mensajes[0] ?? null;

      const noLeido =
        !!ultimo &&
        ultimo.usuarioId !== userId &&
        (!m.chatLeidoEn || new Date(ultimo.enviadoEn) > m.chatLeidoEn);

      return {
        viajeId: String(v.id),
        nombre: v.nombre,
        imagenUrl: v.imagen ?? null,
        ultimoMensaje: ultimo
          ? {
              contenido: ultimo.contenido,
              enviadoEn: ultimo.enviadoEn,
              usuarioId: String(ultimo.usuarioId),
              usuarioNombre: fullName(ultimo.usuario) ?? "Usuario",
            }
          : null,
        noLeido,
      };
    });

    // Los que tienen actividad más reciente primero; sin mensajes, al final.
    data.sort((a, b) => {
      const ta = a.ultimoMensaje ? new Date(a.ultimoMensaje.enviadoEn).getTime() : 0;
      const tb = b.ultimoMensaje ? new Date(b.ultimoMensaje.enviadoEn).getTime() : 0;
      return tb - ta;
    });

    res.json(data);
  } catch (error) {
    console.error("Error en GET /viajes/usuario/:id/chats", error);
    res.status(500).json({ error: "Error al obtener los chats de las tribus" });
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

    const viajesFormateados = viajes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      ubicacion: v.ubicacion,
      descripcion: v.descripcion ?? "",
      foto: v.imagen ?? "",
      imagen: v.imagen,
      imagenUrl: v.imagen ? v.imagen : null,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      miembrosCant: v.miembros.length,
      miembrosNombres: v.miembros.map((m) => fullName(m.usuario)),
    }));

    res.json(viajesFormateados);
  } catch (error) {
    console.error("Error en GET /viajes/:userId", error);
    res.status(500).json({ error: "Error al obtener viajes" });
  }
});


router.get("/:viajeId/participantes", async (req: AuthRequest, res) => {
  const { viajeId } = req.params;
  try {
    if (!(await esMiembroDelViaje(Number(viajeId), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const miembros = await prisma.miembroViaje.findMany({
      where: { viajeId: Number(viajeId) },
      include: {
        usuario: { select: NOMBRE_APELLIDO_AVATAR_SELECT },
      },
    });

    const participantes = miembros.map((m) => ({
      id: String(m.usuario.id),
      name: fullName(m.usuario),
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
router.get("/:viajeId/gastos", async (req: AuthRequest, res) => {
  const { viajeId } = req.params;
  try {
    if (!(await esMiembroDelViaje(Number(viajeId), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const gastos = await prisma.gasto.findMany({
      where: { viajeId: Number(viajeId) },
      include: {
        pagadoPor: { select: NOMBRE_APELLIDO_SELECT },
        participantes: { select: NOMBRE_APELLIDO_SELECT },
      },
      orderBy: { creadoEn: "desc" },
    });

    const gastosFormateados = gastos.map((g) => ({
      id: String(g.id),
      title: g.descripcion ?? "Gasto",
      description: g.descripcion ?? "",
      amount: Number(g.monto),
      payerId: String(g.pagadoPorId),
      payerName: fullName(g.pagadoPor),
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

// GET /viajes/:viajeId/settlements -> pagos que saldan deudas dentro del viaje
router.get("/:viajeId/settlements", async (req: AuthRequest, res) => {
  const { viajeId } = req.params;
  try {
    if (!(await esMiembroDelViaje(Number(viajeId), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const settlements = await prisma.settlement.findMany({
      where: { viajeId: Number(viajeId) },
      include: {
        pagador: { select: NOMBRE_APELLIDO_SELECT },
        receptor: { select: NOMBRE_APELLIDO_SELECT },
      },
      orderBy: { creadoEn: "desc" },
    });

    const settlementsFormateados = settlements.map((s) => ({
      id: String(s.id),
      monto: Number(s.monto),
      pagadorId: String(s.pagadorId),
      pagadorNombre: fullName(s.pagador),
      receptorId: String(s.receptorId),
      receptorNombre: fullName(s.receptor),
      createdAt: s.creadoEn,
    }));

    res.json(settlementsFormateados);
  } catch (error) {
    console.error("Error en GET /viajes/:viajeId/settlements", error);
    res.status(500).json({ error: "Error al obtener los pagos del viaje" });
  }
});

// POST /viajes/:viajeId/settlements -> registrar un pago que salda una deuda
router.post("/:viajeId/settlements", async (req, res) => {
  const { viajeId } = req.params;
  const { pagadorId, receptorId, monto } = req.body;

  if (monto == null || Number.isNaN(Number(monto)) || Number(monto) <= 0) {
    return res.status(400).json({ error: "Monto inválido" });
  }
  if (!pagadorId || !receptorId) {
    return res.status(400).json({ error: "Faltan pagadorId o receptorId" });
  }
  if (Number(pagadorId) === Number(receptorId)) {
    return res.status(400).json({ error: "El pagador y el receptor no pueden ser la misma persona" });
  }

  try {
    const nuevo = await prisma.settlement.create({
      data: {
        monto: Number(monto),
        pagadorId: Number(pagadorId),
        receptorId: Number(receptorId),
        viajeId: Number(viajeId),
      },
      include: {
        pagador: { select: NOMBRE_APELLIDO_SELECT },
        receptor: { select: NOMBRE_APELLIDO_SELECT },
      },
    });

    res.status(201).json({
      id: String(nuevo.id),
      monto: Number(nuevo.monto),
      pagadorId: String(nuevo.pagadorId),
      pagadorNombre: fullName(nuevo.pagador),
      receptorId: String(nuevo.receptorId),
      receptorNombre: fullName(nuevo.receptor),
      createdAt: nuevo.creadoEn,
    });
  } catch (error) {
    console.error("Error en POST /viajes/:viajeId/settlements", error);
    res.status(500).json({ error: "Error al registrar el pago" });
  }
});

router.get("/detalle/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    if (!(await esMiembroDelViaje(Number(id), req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

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

    res.json({
      ...viaje,
      imagenUrl: viaje.imagen,
      miembrosCant: miembrosParseados.length,
      miembros: miembrosParseados,
    });
  } catch (error) {
    console.error("Error al obtener viaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


router.post("/:id/miembros", async (req: AuthRequest, res) => {
  try {
    const viajeId = Number(req.params.id);
    if (Number.isNaN(viajeId)) return res.status(400).json({ error: "id inválido" });

    const currentUserId = req.userId!;
    const { usuarioId, email, rol } = req.body;

    if (!(await esMiembroDelViaje(viajeId, currentUserId))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    let user = null as any;
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
            usuario: { select: NOMBRE_APELLIDO_AVATAR_SELECT },
          },
        },
        _count: { select: { miembros: true } },
      },
    });

    const miembros = (detalle!.miembros ?? []).map((m) => ({
      id: m.usuario?.id ?? m.id,
      nombre: m.usuario?.nombre ?? "Miembro",
      apellido: m.usuario?.apellido ?? "",
      avatarUri: m.usuario?.avatarUri ?? null,
      rol: m.rol,
    }));

    res.status(201).json({ ok: true, miembrosCant: detalle?._count.miembros ?? 0, miembros });
  } catch (e) {
    console.error("[POST /viajes/:id/miembros] Error:", e);
    res.status(500).json({ error: "Error al agregar miembro" });
  }
});

// DELETE /viajes/:viajeId/miembros/:usuarioId -> saca a alguien del viaje.
// Lo puede hacer cualquier miembro del viaje (incluido uno mismo, para
// abandonarlo).
router.delete("/:viajeId/miembros/:usuarioId", async (req: AuthRequest, res) => {
  try {
    const viajeId = Number(req.params.viajeId);
    const usuarioId = Number(req.params.usuarioId);
    if (Number.isNaN(viajeId) || Number.isNaN(usuarioId)) {
      return res.status(400).json({ error: "id inválido" });
    }

    const currentUserId = req.userId!;
    if (!(await esMiembroDelViaje(viajeId, currentUserId))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const miembro = await prisma.miembroViaje.findFirst({
      where: { viajeId, usuarioId },
      select: { id: true },
    });
    if (!miembro) return res.status(404).json({ error: "Ese usuario no es miembro del viaje" });

    await prisma.miembroViaje.delete({ where: { id: miembro.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /viajes/:viajeId/miembros/:usuarioId] Error:", e);
    res.status(500).json({ error: "Error al quitar miembro" });
  }
});

router.get("/:viajeId/itinerario", async (req: AuthRequest, res) => {
  try {
    const viajeId = Number(req.params.viajeId);
    if (Number.isNaN(viajeId)) return res.status(400).json({ error: "viajeId inválido" });
    if (!(await esMiembroDelViaje(viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

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
router.post("/:viajeId/itinerario", async (req: AuthRequest, res) => {
  try {
    const viajeId = Number(req.params.viajeId);
    if (!(await esMiembroDelViaje(viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const { titulo, descripcion, fechaHora, ubicacion } = req.body;
    if (!titulo || !fechaHora) return res.status(400).json({ error: "Falta titulo o fechaHora" });

    const row = await prisma.itinerarioEvento.create({
      data: {
        viajeId,
        titulo,
        descripcion: descripcion ?? null,
        ubicacion: ubicacion ?? null,
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
router.put("/itinerario/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.itinerarioEvento.findUnique({ where: { id }, select: { viajeId: true } });
    if (!existente) return res.status(404).json({ error: "Evento no encontrado" });
    if (!(await esMiembroDelViaje(existente.viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    const { titulo, descripcion, fechaHora, ubicacion } = req.body;

    const row = await prisma.itinerarioEvento.update({
      where: { id },
      data: {
        titulo,
        descripcion: descripcion ?? null,
        ubicacion: ubicacion ?? null,
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
router.delete("/itinerario/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.itinerarioEvento.findUnique({ where: { id }, select: { viajeId: true } });
    if (!existente) return res.status(404).json({ error: "Evento no encontrado" });
    if (!(await esMiembroDelViaje(existente.viajeId, req.userId!))) {
      return res.status(403).json({ error: "No sos miembro de este viaje" });
    }

    await prisma.itinerarioEvento.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar evento" });
  }
});

// ---------------------------------------------------------------------
// Chat grupal del viaje: todos los miembros del viaje comparten un único
// chat (a diferencia del chat 1 a 1 de /chats, que es entre dos usuarios).
// Reusa el modelo ChatMensaje que ya existía en el schema.
// ---------------------------------------------------------------------

// GET /viajes/:viajeId/chat -> historial de mensajes del chat grupal
router.get("/:viajeId/chat", async (req, res) => {
  const viajeId = Number(req.params.viajeId);
  if (Number.isNaN(viajeId)) return res.status(400).json({ error: "viajeId inválido" });

  try {
    const mensajes = await prisma.chatMensaje.findMany({
      where: { viajeId },
      include: { usuario: { select: NOMBRE_APELLIDO_SELECT } },
      orderBy: { enviadoEn: "asc" },
    });

    res.json(
      mensajes.map((m) => ({
        id: String(m.id),
        contenido: m.contenido,
        usuarioId: String(m.usuarioId),
        usuarioNombre: fullName(m.usuario) ?? "Usuario",
        enviadoEn: m.enviadoEn,
      }))
    );
  } catch (error) {
    console.error("Error en GET /viajes/:viajeId/chat", error);
    res.status(500).json({ error: "Error al obtener el chat del viaje" });
  }
});

// POST /viajes/:viajeId/chat -> body { usuarioId, contenido }
router.post("/:viajeId/chat", async (req, res) => {
  const viajeId = Number(req.params.viajeId);
  const { usuarioId, contenido } = req.body;

  if (Number.isNaN(viajeId)) return res.status(400).json({ error: "viajeId inválido" });
  if (!usuarioId || !contenido || !String(contenido).trim()) {
    return res.status(400).json({ error: "Faltan usuarioId o contenido" });
  }

  try {
    const esMiembro = await prisma.miembroViaje.findFirst({
      where: { viajeId, usuarioId: Number(usuarioId) },
      select: { id: true },
    });
    if (!esMiembro) return res.status(403).json({ error: "No sos miembro de este viaje" });

    const nuevo = await prisma.chatMensaje.create({
      data: {
        viajeId,
        usuarioId: Number(usuarioId),
        contenido: String(contenido).trim(),
      },
      include: { usuario: { select: NOMBRE_APELLIDO_SELECT } },
    });

    res.status(201).json({
      id: String(nuevo.id),
      contenido: nuevo.contenido,
      usuarioId: String(nuevo.usuarioId),
      usuarioNombre: fullName(nuevo.usuario) ?? "Usuario",
      enviadoEn: nuevo.enviadoEn,
    });
  } catch (error) {
    console.error("Error en POST /viajes/:viajeId/chat", error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
});

// POST /viajes/:viajeId/chat/leido -> body { usuarioId } marca el chat
// grupal como leído hasta este momento, para ese usuario.
router.post("/:viajeId/chat/leido", async (req, res) => {
  const viajeId = Number(req.params.viajeId);
  const { usuarioId } = req.body;

  if (Number.isNaN(viajeId)) return res.status(400).json({ error: "viajeId inválido" });
  if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

  try {
    const miembro = await prisma.miembroViaje.findFirst({
      where: { viajeId, usuarioId: Number(usuarioId) },
      select: { id: true },
    });
    if (!miembro) return res.status(403).json({ error: "No sos miembro de este viaje" });

    await prisma.miembroViaje.update({
      where: { id: miembro.id },
      data: { chatLeidoEn: new Date() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error en POST /viajes/:viajeId/chat/leido", error);
    res.status(500).json({ error: "Error al marcar como leído" });
  }
});

// GET /viajes/:viajeId/chat/estado?usuarioId=X -> { noLeido: boolean }
// Endpoint liviano para mostrar el puntito de "no leído" en el botón Chat
// sin tener que traer todos los mensajes.
router.get("/:viajeId/chat/estado", async (req, res) => {
  const viajeId = Number(req.params.viajeId);
  const usuarioId = Number(req.query.usuarioId);

  if (Number.isNaN(viajeId) || Number.isNaN(usuarioId)) {
    return res.status(400).json({ error: "viajeId o usuarioId inválido" });
  }

  try {
    const miembro = await prisma.miembroViaje.findFirst({
      where: { viajeId, usuarioId },
      select: { chatLeidoEn: true },
    });
    if (!miembro) return res.status(403).json({ error: "No sos miembro de este viaje" });

    const ultimo = await prisma.chatMensaje.findFirst({
      where: { viajeId },
      orderBy: { enviadoEn: "desc" },
      select: { usuarioId: true, enviadoEn: true },
    });

    const noLeido =
      !!ultimo &&
      ultimo.usuarioId !== usuarioId &&
      (!miembro.chatLeidoEn || new Date(ultimo.enviadoEn) > miembro.chatLeidoEn);

    res.json({ noLeido });
  } catch (error) {
    console.error("Error en GET /viajes/:viajeId/chat/estado", error);
    res.status(500).json({ error: "Error al consultar el estado del chat" });
  }
});

export default router;
