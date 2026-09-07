import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { unauthorized } from "../utils/httpError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized("Missing bearer token"));
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
