// Select de Prisma reusado en casi todas las respuestas que incluyen
// datos básicos de un usuario (pagador, remitente de un mensaje, miembro
// de un viaje, etc.), en vez de repetir el mismo objeto literal en cada
// endpoint.
export const NOMBRE_APELLIDO_SELECT = { id: true, nombre: true, apellido: true } as const;

// Misma idea, para las respuestas que además necesitan mostrar el avatar
// (listas de participantes, chats 1 a 1).
export const NOMBRE_APELLIDO_AVATAR_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  avatarUri: true,
} as const;

export function fullName(user: { nombre: string; apellido: string } | null | undefined): string | null {
  if (!user) return null;
  return `${user.nombre} ${user.apellido}`;
}
