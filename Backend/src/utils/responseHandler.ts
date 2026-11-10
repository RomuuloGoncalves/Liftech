import type { Response } from "express";

export enum StatusCode {
  OK = 200,
  CREATED = 201,
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

// Erro com o status HTTP que o controller deve responder.
export class ErroHttp extends Error {
  constructor(
    readonly status: StatusCode,
    message: string
  ) {
    super(message);
  }
}

export function responderErro(res: Response, error: unknown) {
  if (error instanceof ErroHttp) return respostaErro(res, error.status, error.message);
  return respostaErro(res, StatusCode.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : String(error));
}
