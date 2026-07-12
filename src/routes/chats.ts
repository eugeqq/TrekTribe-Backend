// routes/chats.ts
// Chat 1 a 1 entre usuarios, independiente de los viajes/tribus.
// La invitación sigue la misma lógica que agregar un miembro a un viaje
// (POST /viajes/:id/miembros): se busca al usuario por email y, si existe,
// se crea el vínculo directamente — sin un paso de aceptar/rechazar.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import validator from "validator";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { fullName, NOMBRE_APELLIDO_AVATAR_SELECT } from "../utils/format";
import prisma from "../utils/prisma";

const router = Router();

router.use(requireAuth);

const invitarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 invitaciones por IP
  message: "Demasiados intentos. Inténtalo de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /chats/usuario/:userId -> lista de chats del usuario, con datos del
// otro participante y una preview del último mensaje.
router.get("/usuario/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) return res.status(400).json({ error: "userId inválido" });

  try {
    const chats = await prisma.chat.findMany({
      where: { OR: [{ usuarioAId: userId }, { usuarioBId: userId }] },
      include: {
        usuarioA: { select: NOMBRE_APELLIDO_AVATAR_SELECT },
        usuarioB: { select: NOMBRE_APELLIDO_AVATAR_SELECT },
        mensajes: { orderBy: { enviadoEn: "desc" }, take: 1 },
      },
      orderBy: { creadoEn: "desc" },
    });

    const data = chats.map((c) => {
      const soyA = c.usuarioAId === userId;
      const otro = soyA ? c.usuarioB : c.usuarioA;
      const ultimo = c.mensajes[0] ?? null;
      const miUltimaLectura = soyA ? c.leidoPorAEn : c.leidoPorBEn;

      // No leído: hay un último mensaje, no lo mandé yo, y es más nuevo
      // que la última vez que abrí este chat (o nunca lo abrí).
      const noLeido =
        !!ultimo &&
        String(ultimo.usuarioId) !== String(userId) &&
        (!miUltimaLectura || new Date(ultimo.enviadoEn) > miUltimaLectura);

      return {
        id: String(c.id),
        otroUsuario: {
          id: String(otro.id),
          nombre: fullName(otro),
          avatarUri: otro.avatarUri ?? null,
        },
        ultimoMensaje: ultimo
          ? { contenido: ultimo.contenido, enviadoEn: ultimo.enviadoEn, usuarioId: String(ultimo.usuarioId) }
          : null,
        noLeido,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Error en GET /chats/usuario/:userId", error);
    res.status(500).json({ error: "Error al obtener los chats" });
  }
});

// POST /chats/invitar -> body { currentUserId, email }
// Busca al usuario por email e inicia (o reutiliza) el chat con él.
router.post("/invitar", invitarLimiter, async (req: AuthRequest, res) => {
  const { email } = req.body;
  const meId = req.userId!;

  if (!email) {
    return res.status(400).json({ error: "Falta email" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const otro = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!otro) return res.status(404).json({ error: "Usuario no encontrado" });

    if (otro.id === meId) {
      return res.status(400).json({ error: "No podés iniciar un chat con vos mismo" });
    }

    // ¿Ya existe un chat entre estos dos usuarios (en cualquier orden)?
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { usuarioAId: meId, usuarioBId: otro.id },
          { usuarioAId: otro.id, usuarioBId: meId },
        ],
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { usuarioAId: meId, usuarioBId: otro.id },
      });
    }

    res.status(201).json({
      id: String(chat.id),
      otroUsuario: {
        id: String(otro.id),
        nombre: fullName(otro),
        avatarUri: otro.avatarUri ?? null,
      },
    });
  } catch (error) {
    console.error("Error en POST /chats/invitar", error);
    res.status(500).json({ error: "Error al iniciar el chat" });
  }
});

// POST /chats/:chatId/leido -> body { usuarioId } marca el chat como leído
// hasta este momento, para ese usuario.
router.post("/:chatId/leido", async (req, res) => {
  const chatId = Number(req.params.chatId);
  const { usuarioId } = req.body;

  if (Number.isNaN(chatId)) return res.status(400).json({ error: "chatId inválido" });
  if (!usuarioId) return res.status(400).json({ error: "Falta usuarioId" });

  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });

    const uid = Number(usuarioId);
    if (chat.usuarioAId !== uid && chat.usuarioBId !== uid) {
      return res.status(403).json({ error: "No sos participante de este chat" });
    }

    const esA = chat.usuarioAId === uid;
    await prisma.chat.update({
      where: { id: chatId },
      data: esA ? { leidoPorAEn: new Date() } : { leidoPorBEn: new Date() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error en POST /chats/:chatId/leido", error);
    res.status(500).json({ error: "Error al marcar como leído" });
  }
});

// GET /chats/:chatId/mensajes -> historial de mensajes de un chat
router.get("/:chatId/mensajes", async (req: AuthRequest, res) => {
  const chatId = Number(req.params.chatId);
  if (Number.isNaN(chatId)) return res.status(400).json({ error: "chatId inválido" });

  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { usuarioAId: true, usuarioBId: true } });
    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });
    if (chat.usuarioAId !== req.userId && chat.usuarioBId !== req.userId) {
      return res.status(403).json({ error: "No sos participante de este chat" });
    }

    const mensajes = await prisma.mensajeChatPrivado.findMany({
      where: { chatId },
      orderBy: { enviadoEn: "asc" },
    });

    res.json(
      mensajes.map((m) => ({
        id: String(m.id),
        contenido: m.contenido,
        usuarioId: String(m.usuarioId),
        enviadoEn: m.enviadoEn,
      }))
    );
  } catch (error) {
    console.error("Error en GET /chats/:chatId/mensajes", error);
    res.status(500).json({ error: "Error al obtener los mensajes" });
  }
});

// POST /chats/:chatId/mensajes -> body { contenido }
router.post("/:chatId/mensajes", async (req: AuthRequest, res) => {
  const chatId = Number(req.params.chatId);
  const { contenido } = req.body;
  const uid = req.userId!;

  if (Number.isNaN(chatId)) return res.status(400).json({ error: "chatId inválido" });
  if (!contenido || !String(contenido).trim()) {
    return res.status(400).json({ error: "Falta contenido" });
  }

  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ error: "Chat no encontrado" });

    if (chat.usuarioAId !== uid && chat.usuarioBId !== uid) {
      return res.status(403).json({ error: "No sos participante de este chat" });
    }

    const nuevo = await prisma.mensajeChatPrivado.create({
      data: {
        chatId,
        usuarioId: uid,
        contenido: String(contenido).trim(),
      },
    });

    res.status(201).json({
      id: String(nuevo.id),
      contenido: nuevo.contenido,
      usuarioId: String(nuevo.usuarioId),
      enviadoEn: nuevo.enviadoEn,
    });
  } catch (error) {
    console.error("Error en POST /chats/:chatId/mensajes", error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
});

export default router;
