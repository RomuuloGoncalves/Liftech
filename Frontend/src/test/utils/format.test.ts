import { describe, expect, it } from 'vitest'
import { formatAlertDate, formatDuration, formatEventDate, formatHours } from '../../utils/format'

describe('formatEventDate', () => {
  it('formats as weekday short, day, month long and year in pt-BR, without dot or "de"', () => {
    expect(formatEventDate('2025-09-14', 'pt-BR')).toBe('Dom, 14 setembro 2025')
  })

  it('does not shift the day with the machine time zone', () => {
    expect(formatEventDate('2025-01-01', 'pt-BR')).toBe('Qua, 1 janeiro 2025')
  })

  it('follows the active language', () => {
    expect(formatEventDate('2025-09-14', 'en-US')).toBe('Sun, 14 September 2025')
  })
})

describe('formatAlertDate', () => {
  it('formats as day, capitalized long month and year in pt-BR, without weekday or "de"', () => {
    expect(formatAlertDate('2026-01-23', 'pt-BR')).toBe('23 Janeiro 2026')
  })

  it('does not shift the day with the machine time zone', () => {
    expect(formatAlertDate('2025-01-01', 'pt-BR')).toBe('1 Janeiro 2025')
  })
})

describe('formatDuration', () => {
  it('shows whole hours, rounding the seconds away', () => {
    expect(formatDuration('14:35:25', '16:35:20', 'pt-BR')).toBe('2 horas')
  })

  it('shows minutes under one hour', () => {
    expect(formatDuration('14:00:00', '14:45:00', 'pt-BR')).toBe('45 minutos')
  })

  it('shows hours and minutes together', () => {
    expect(formatDuration('14:00:00', '15:30:00', 'pt-BR')).toBe('1 hora 30 minutos')
  })

  it('follows the active language', () => {
    expect(formatDuration('14:35:25', '16:35:20', 'en-US')).toBe('2 hours')
  })

  it('never goes negative', () => {
    expect(formatDuration('16:00:00', '15:00:00', 'pt-BR')).toBe('0 minuto')
  })
})

describe('formatHours', () => {
  it('formats the total usage with a short hour unit', () => {
    expect(formatHours(7, 'pt-BR')).toMatch(/^7\s?h/)
    expect(formatHours(7, 'en-US')).toMatch(/^7\s?hr/)
  })
})
