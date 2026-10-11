export const LOOP_FADE_SECONDS = 0.3

export function loopFade(time: number, duration: number, fade = LOOP_FADE_SECONDS): number {
  if (!Number.isFinite(duration) || duration <= 0) return 1
  const edge = Math.min(time, duration - time) / fade
  return Math.max(0, Math.min(1, edge))
}
