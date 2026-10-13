import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../schemas/user.js";
import { env } from "../config/env.js";
import { StatusCode, respostaErro } from "../utils/responseHandler.js";
import { carregarEscopo } from "./escopo.js";

const NAO_AUTENTICADO = "Não autenticado.";
const ERROS_DE_TOKEN = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"];
const OBJECT_ID = /^[0-9a-f]{24}$/i;

// Valida o Bearer token e lê o usuário do banco a cada requisição, então mudança de acesso vale na hora.
export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
  if (!token) return respostaErro(res, StatusCode.UNAUTHORIZED, NAO_AUTENTICADO);
  if (!env.jwt_secret) return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, "JWT_SECRET não configurado.");

  try {
    const { sub } = jwt.verify(token, env.jwt_secret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (typeof sub !== "string" || !OBJECT_ID.test(sub)) return respostaErro(res, StatusCode.UNAUTHORIZED, NAO_AUTENTICADO);

    const usuario = await User.findById(sub).lean();
    if (!usuario) return respostaErro(res, StatusCode.UNAUTHORIZED, NAO_AUTENTICADO);

    req.escopo = await carregarEscopo(usuario);
  } catch (error: any) {
    if (ERROS_DE_TOKEN.includes(error.name)) return respostaErro(res, StatusCode.UNAUTHORIZED, NAO_AUTENTICADO);
    return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error.message);
  }
  next();
}
