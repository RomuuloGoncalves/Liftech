import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const TAMANHO_HASH = 64;

export function gerarHashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, TAMANHO_HASH).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash || hash.length !== TAMANHO_HASH * 2) return false;

  const calculado = scryptSync(senha, salt, TAMANHO_HASH);
  return timingSafeEqual(calculado, Buffer.from(hash, "hex"));
}
