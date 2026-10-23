import { describe, it, expect } from 'vitest';
import ptBR from '../../locales/pt-BR/translation.json';
import enUS from '../../locales/en-US/translation.json';
import es from '../../locales/es/translation.json';
import fr from '../../locales/fr/translation.json';
import ja from '../../locales/ja/translation.json';
import de from '../../locales/de/translation.json';
import ru from '../../locales/ru/translation.json';

interface LevelInfoLocale {
  title?: string;
  open?: string;
  level?: Record<string, string>;
  description?: Record<string, string>;
}

interface LocaleData {
  levelInfo?: LevelInfoLocale;
}

const ALL_LOCALES: { code: string; data: LocaleData }[] = [
  { code: 'pt-BR', data: ptBR as LocaleData },
  { code: 'en-US', data: enUS as LocaleData },
  { code: 'es',    data: es as LocaleData },
  { code: 'fr',    data: fr as LocaleData },
  { code: 'ja',    data: ja as LocaleData },
  { code: 'de',    data: de as LocaleData },
  { code: 'ru',    data: ru as LocaleData },
];

const REQUIRED_LEVEL_KEYS = ['critica', 'alta', 'media'] as const;
const REQUIRED_DESC_KEYS = ['tombamento', 'colisao', 'frenagem'] as const;

describe('levelInfo locales (EXP-11)', () => {
  it.each(ALL_LOCALES)('locale $code contains all levelInfo keys with non-empty strings', ({ code, data }) => {
    const levelInfo = data.levelInfo;
    expect(levelInfo, `Locale "${code}" is missing levelInfo`).toBeDefined();
    if (!levelInfo) return;

    expect(typeof levelInfo.title, `Locale "${code}" levelInfo.title must be string`).toBe('string');
    expect(levelInfo.title?.trim().length, `Locale "${code}" levelInfo.title must not be empty`).toBeGreaterThan(0);

    expect(typeof levelInfo.open, `Locale "${code}" levelInfo.open must be string`).toBe('string');
    expect(levelInfo.open?.trim().length, `Locale "${code}" levelInfo.open must not be empty`).toBeGreaterThan(0);

    expect(levelInfo.level, `Locale "${code}" levelInfo.level must exist`).toBeDefined();
    for (const key of REQUIRED_LEVEL_KEYS) {
      const val = levelInfo.level?.[key];
      expect(typeof val, `Locale "${code}" levelInfo.level.${key} must be string`).toBe('string');
      expect(val?.trim().length, `Locale "${code}" levelInfo.level.${key} must not be empty`).toBeGreaterThan(0);
    }

    expect(levelInfo.description, `Locale "${code}" levelInfo.description must exist`).toBeDefined();
    for (const key of REQUIRED_DESC_KEYS) {
      const val = levelInfo.description?.[key];
      expect(typeof val, `Locale "${code}" levelInfo.description.${key} must be string`).toBe('string');
      expect(val?.trim().length, `Locale "${code}" levelInfo.description.${key} must not be empty`).toBeGreaterThan(0);
    }
  });

  it.each(ALL_LOCALES)('locale $code contains exactly one pair of <b>...</b> in each description', ({ code, data }) => {
    const levelInfo = data.levelInfo;
    for (const key of REQUIRED_DESC_KEYS) {
      const desc = levelInfo?.description?.[key] ?? '';
      const bOpenCount = (desc.match(/<b>/g) || []).length;
      const bCloseCount = (desc.match(/<\/b>/g) || []).length;
      expect(bOpenCount, `Locale "${code}" description.${key} must have exactly one <b>`).toBe(1);
      expect(bCloseCount, `Locale "${code}" description.${key} must have exactly one </b>`).toBe(1);
    }
  });

  it('matches design.md exactly for pt-BR values', () => {
    const levelInfo = (ptBR as LocaleData).levelInfo;
    expect(levelInfo?.title).toBe('Informações sobre nível crítico');
    expect(levelInfo?.open).toBe('Sobre os níveis de urgência');
    expect(levelInfo?.level).toEqual({
      critica: 'Crítico',
      alta: 'Alta',
      media: 'Média',
    });
    expect(levelInfo?.description).toEqual({
      tombamento: 'Nível de urgência crítico associado a um <b>tombamento</b>.',
      colisao: 'Nível de urgência crítico associado a uma <b>colisão</b>.',
      frenagem: 'Nível de urgência crítico associado a uma <b>frenagem brusca</b>.',
    });
  });
});
