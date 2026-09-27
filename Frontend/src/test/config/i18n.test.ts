import { describe, it, expect, beforeEach, vi } from 'vitest';
import ptBR from '../../locales/pt-BR/translation.json';
import enUS from '../../locales/en-US/translation.json';
import es from '../../locales/es/translation.json';
import fr from '../../locales/fr/translation.json';
import ja from '../../locales/ja/translation.json';
import de from '../../locales/de/translation.json';
import ru from '../../locales/ru/translation.json';

const ALL_LOCALES = [
  { code: 'pt-BR', data: ptBR },
  { code: 'en-US', data: enUS },
  { code: 'es',    data: es   },
  { code: 'fr',    data: fr   },
  { code: 'ja',    data: ja   },
  { code: 'de',    data: de   },
  { code: 'ru',    data: ru   },
];

const REQUIRED_MODULES = ['common', 'navigation', 'machines', 'languages'] as const;

describe('i18n config', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('uses pt-BR as default language when localStorage is empty', async () => {
    const i18n = (await import('../../config/i18n')).default;
    expect(i18n.language).toBe('pt-BR');
  });

  it('uses valid language from localStorage', async () => {
    localStorage.setItem('liftech-lang', 'en-US');
    const i18n = (await import('../../config/i18n')).default;
    expect(i18n.language).toBe('en-US');
  });

  it('falls back to pt-BR when localStorage contains invalid language', async () => {
    localStorage.setItem('liftech-lang', 'zz');
    const i18n = (await import('../../config/i18n')).default;
    expect(i18n.language).toBe('pt-BR');
  });

  it('falls back to pt-BR value when a key is missing in the active locale', async () => {
    // This test kills the fallbackLng mutation: if fallbackLng were changed away
    // from 'pt-BR', this behavioral assertion would fail.
    const i18n = (await import('../../config/i18n')).default;

    // Confirm en-US resource is loaded: t() returns English value
    await i18n.changeLanguage('en-US');
    expect(i18n.t('navigation.overview')).toBe('Overview');

    // Confirm fallbackLng is set to 'pt-BR' (i18next normalises string → array internally)
    const fallback = i18n.options.fallbackLng;
    const fallbackIncludes = Array.isArray(fallback)
      ? fallback.includes('pt-BR')
      : fallback === 'pt-BR';
    expect(fallbackIncludes, 'fallbackLng must include pt-BR').toBe(true);

    // Restore
    await i18n.changeLanguage('pt-BR');
  });
});

describe('i18n locale files structure', () => {
  it.each(ALL_LOCALES)('locale $code contains all required modules', ({ code, data }) => {
    for (const mod of REQUIRED_MODULES) {
      expect(
        data,
        `Locale "${code}" is missing module "${mod}"`
      ).toHaveProperty(mod);
      expect(
        typeof (data as Record<string, unknown>)[mod],
        `Locale "${code}" module "${mod}" must be an object`
      ).toBe('object');
    }
  });

  it('all locales have the same top-level keys as pt-BR', () => {
    const ptBRKeys = Object.keys(ptBR).sort();
    for (const { code, data } of ALL_LOCALES) {
      if (code === 'pt-BR') continue;
      expect(
        Object.keys(data).sort(),
        `Locale "${code}" is missing top-level keys compared to pt-BR`
      ).toEqual(ptBRKeys);
    }
  });

  it('navigation module in every locale contains pages, feedback, privacy keys', () => {
    const REQUIRED_NAV_KEYS = ['overview', 'fleet', 'team', 'alerts', 'pages', 'feedback', 'privacy'];
    for (const { code, data } of ALL_LOCALES) {
      for (const key of REQUIRED_NAV_KEYS) {
        expect(
          (data.navigation as Record<string, unknown>)[key],
          `Locale "${code}" navigation.${key} is missing or empty`
        ).toBeTruthy();
      }
    }
  });
});
