import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno. Configúralo para seguridad.");
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  userId?: number;
}

// Verifica el JWT emitido en /login y expone el id del usuario autenticado
// en req.userId. Las rutas deben usar este valor como fuente de verdad de
// "quién soy" en vez de confiar en un id que venga en el body/params/query.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Falta el token de autenticación" });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = Number(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
