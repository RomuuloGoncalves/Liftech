import type { Response } from "express";

export enum StatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export function respostaSucesso(res: Response, status: StatusCode, data?: any) {
  if (data !== undefined) {
    return res.status(status).json(data);
  }
  return res.status(status).send();
}

export function respostaErro(res: Response, status: StatusCode, message: string | Record<string, any>) {
  return res.status(status).json({ error: message });
}
