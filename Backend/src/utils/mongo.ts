import { ErroHttp, StatusCode } from "./responseHandler.js";

export const ehChaveDuplicada = (error: unknown): boolean => (error as { code?: number } | null)?.code === 11000;

// Devolve o tradutor de erro de índice único: chave duplicada vira 409 com a mensagem; o resto segue como estava.
export function conflitoSeDuplicado(mensagem: string) {
  return (error: unknown): never => {
    throw ehChaveDuplicada(error) ? new ErroHttp(StatusCode.CONFLICT, mensagem) : error;
  };
}
