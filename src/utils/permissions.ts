import prisma from "./prisma";

// Un usuario puede ver/tocar los datos de un viaje si es su creador o
// figura como miembro (MiembroViaje). Antes esta misma función estaba
// copiada casi igual en viajes.ts, tareas.ts y gastos.ts.
export async function esMiembroDelViaje(viajeId: number, usuarioId: number): Promise<boolean> {
  const viaje = await prisma.viaje.findUnique({ where: { id: viajeId }, select: { creadorId: true } });
  if (!viaje) return false;
  if (viaje.creadorId === usuarioId) return true;
  const miembro = await prisma.miembroViaje.findFirst({
    where: { viajeId, usuarioId },
    select: { id: true },
  });
  return !!miembro;
}
