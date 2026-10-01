const toSeconds = (time: string): number => {
  const [h = 0, m = 0, s = 0] = time.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1)

/** "2025-09-14" -> "Dom, 14 setembro 2025" (weekday short, month long, no "de"). */
export function formatEventDate(isoDate: string, language: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const parts = new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(year, month - 1, day)))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''

  return `${capitalize(get('weekday').replace(/\.$/, ''))}, ${get('day')} ${get('month')} ${get('year')}`
}

const unit = (language: string, name: 'hour' | 'minute', display: 'long' | 'short') =>
  new Intl.NumberFormat(language, { style: 'unit', unit: name, unitDisplay: display })

/** Rounds to the nearest minute: 14:35:25 ~ 16:35:20 -> "2 horas". */
export function formatDuration(start: string, end: string, language: string): string {
  const totalMinutes = Math.max(0, Math.round((toSeconds(end) - toSeconds(start)) / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []

  if (hours > 0) parts.push(unit(language, 'hour', 'long').format(hours))
  if (minutes > 0 || hours === 0) parts.push(unit(language, 'minute', 'long').format(minutes))
  return parts.join(' ')
}

export function formatHours(hours: number, language: string): string {
  return unit(language, 'hour', 'short').format(hours)
}
