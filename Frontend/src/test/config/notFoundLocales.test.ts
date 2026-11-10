import { describe, it, expect } from 'vitest'
import ptBR from '../../locales/pt-BR/translation.json'
import enUS from '../../locales/en-US/translation.json'
import es from '../../locales/es/translation.json'
import fr from '../../locales/fr/translation.json'
import ja from '../../locales/ja/translation.json'
import de from '../../locales/de/translation.json'
import ru from '../../locales/ru/translation.json'

type NotFound = { notFound?: Record<string, string> }

const LOCALES = Object.entries({ 'pt-BR': ptBR, 'en-US': enUS, es, fr, ja, de, ru }) as [string, NotFound][]

describe('notFound locales (NF2-09)', () => {
  it.each(LOCALES)('%s has title, description and backHome', (_, data) => {
    for (const key of ['title', 'description', 'backHome']) {
      expect(data.notFound?.[key]?.trim()).toBeTruthy()
    }
  })

  it('every locale translates the title (no copy of pt-BR)', () => {
    const titles = LOCALES.map(([, d]) => d.notFound?.title)
    expect(new Set(titles).size).toBe(LOCALES.length)
  })
})
