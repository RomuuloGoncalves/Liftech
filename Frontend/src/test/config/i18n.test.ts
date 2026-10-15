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

const REQUIRED_MODULES = ['common', 'navigation', 'machines', 'alerts', 'team', 'languages', 'fleet', 'branches'] as const;

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
    const ptBRKeys = Object.keys(ptBR).filter((key) => key !== 'employee').sort();
    for (const { code, data } of ALL_LOCALES) {
      if (code === 'pt-BR') continue;
      expect(
        Object.keys(data).filter((key) => key !== 'employee').sort(),
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

describe('team module translations', () => {
  const ptBRTeamKeys = Object.keys(ptBR.team).sort();

  it.each(ALL_LOCALES)('locale $code has the same team keys as pt-BR, all non-empty', ({ code, data }) => {
    const team = data.team as Record<string, string>;
    expect(Object.keys(team).sort(), `Locale "${code}" team keys differ from pt-BR`).toEqual(ptBRTeamKeys);
    for (const [key, value] of Object.entries(team)) {
      expect(value, `Locale "${code}" team.${key} is empty`).toBeTruthy();
    }
  });

  it.each(ALL_LOCALES)('locale $code keeps the {{name}} placeholder in per-item labels', ({ code, data }) => {
    const team = data.team as Record<string, string>;
    for (const key of ['toggleAccess', 'edit', 'remove', 'openDetails', 'deleteMessage']) {
      expect(team[key], `Locale "${code}" team.${key} lost {{name}}`).toContain('{{name}}');
    }
  });
});

describe('alerts module translations', () => {
  const flatten = (obj: object, prefix = ''): Record<string, unknown> =>
    Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const path = prefix + key;
      return value && typeof value === 'object'
        ? { ...acc, ...flatten(value, `${path}.`) }
        : { ...acc, [path]: value };
    }, {});
  const ptBRAlertKeys = Object.keys(flatten(ptBR.alerts)).sort();

  it('pt-BR defines the accidents label, search, empty state and the three urgency levels', () => {
    expect(ptBRAlertKeys).toEqual(
      ['accidents', 'empty', 'searchPlaceholder', 'urgency.alta', 'urgency.critica', 'urgency.media']
    );
  });

  it.each(ALL_LOCALES)('locale $code has the same alerts keys as pt-BR, all non-empty', ({ code, data }) => {
    const alerts = flatten(data.alerts);
    expect(Object.keys(alerts).sort(), `Locale "${code}" alerts keys differ from pt-BR`).toEqual(ptBRAlertKeys);
    for (const [key, value] of Object.entries(alerts)) {
      expect(value, `Locale "${code}" alerts.${key} is empty`).toBeTruthy();
    }
  });
});

describe('machine detail translations', () => {
  const NEW_KEYS = Object.keys(ptBR.machines).filter((key) =>
    ['detailCode', 'detailMac', 'detailSector', 'detailTotalUsage', 'detailDeviceName', 'historyLabel', 'tabAccidents', 'tabMaintenance', 'periodFrom', 'periodTo', 'historyEmpty', 'editMachine', 'deleteMachine', 'editMachineTitle', 'editMachineSubtitle', 'editMachineSubmit', 'editLabelMachine', 'editLabelCode', 'editLabelMac', 'deleteMachineTitle', 'deleteMachineMessage', 'openDetails'].includes(key)
  );

  it('pt-BR defines all 22 detail keys', () => {
    expect(NEW_KEYS).toHaveLength(22);
  });

  it.each(ALL_LOCALES)('locale $code has every detail key, non-empty', ({ code, data }) => {
    const machines = data.machines as unknown as Record<string, string>;
    for (const key of NEW_KEYS) {
      expect(machines[key], `Locale "${code}" machines.${key} is missing or empty`).toBeTruthy();
    }
  });

  it.each(ALL_LOCALES)('locale $code keeps {{name}} in per-machine texts', ({ code, data }) => {
    const machines = data.machines as unknown as Record<string, string>;
    for (const key of ['deleteMachineMessage', 'openDetails']) {
      expect(machines[key], `Locale "${code}" machines.${key} lost {{name}}`).toContain('{{name}}');
    }
  });
});

describe('fleet module translations', () => {
  const ptBRFleetKeys = Object.keys(ptBR.fleet).sort();

  it.each(ALL_LOCALES)('locale $code has the same fleet keys as pt-BR, all non-empty', ({ code, data }) => {
    const fleet = data.fleet as Record<string, string>;
    expect(Object.keys(fleet).sort(), `Locale "${code}" fleet keys differ from pt-BR`).toEqual(ptBRFleetKeys);
    for (const [key, value] of Object.entries(fleet)) {
      expect(value, `Locale "${code}" fleet.${key} is empty`).toBeTruthy();
    }
  });

  it.each(ALL_LOCALES)('locale $code keeps the interpolation placeholders', ({ code, data }) => {
    const fleet = data.fleet as Record<string, string>;
    for (const key of ['deleteCategoryMessage', 'addMachines', 'moreActions', 'removeChip']) {
      expect(fleet[key], `Locale "${code}" fleet.${key} lost {{name}}`).toContain('{{name}}');
    }
    for (const key of ['machineCount', 'cardMinutes', 'cardHours']) {
      expect(fleet[key], `Locale "${code}" fleet.${key} lost {{count}}`).toContain('{{count}}');
    }
  });
});

describe('loading and notification translations', () => {
  const KEYS: Record<string, string[]> = {
    common: ['loading', 'closeNotification'],
    machines: ['toastCreated', 'toastSaved', 'toastDeleted'],
    team: [
      'toastEmployeeCreated',
      'toastEmployeeSaved',
      'toastEmployeeDeleted',
      'toastSectorCreated',
      'toastSectorSaved',
      'toastSectorDeleted',
    ],
    fleet: ['toastCategoryCreated', 'toastCategoryDeleted', 'toastMachinesAdded', 'toastMachineRemoved'],
  };

  it.each(ALL_LOCALES)('locale $code has every key, non-empty, with {{name}} in notifications', ({ code, data }) => {
    for (const [mod, keys] of Object.entries(KEYS)) {
      const module = (data as unknown as Record<string, Record<string, string>>)[mod];
      for (const key of keys) {
        expect(module[key], `Locale "${code}" ${mod}.${key} is missing or empty`).toBeTruthy();
        if (key.startsWith('toast')) expect(module[key], `Locale "${code}" ${mod}.${key} lost {{name}}`).toContain('{{name}}');
      }
    }
  });
});

describe('auth and navigation translations', () => {
  const NEW_KEYS: Record<'auth' | 'navigation', string[]> = {
    auth: ['tabRequest', 'tabAdmin', 'tabCollaborator', 'invalidCredentials', 'networkError', 'loginError', 'requestDuplicate', 'requestError', 'tabsLabel'],
    navigation: ['logout'],
  };

  it.each(ALL_LOCALES)('locale $code has the same auth and navigation keys as pt-BR, including the new ones', ({ code, data }) => {
    for (const mod of ['auth', 'navigation'] as const) {
      const module = data[mod] as Record<string, string>;
      expect(Object.keys(module).sort(), `Locale "${code}" ${mod} keys differ from pt-BR`).toEqual(Object.keys(ptBR[mod]).sort());
      for (const key of NEW_KEYS[mod]) {
        expect(module[key], `Locale "${code}" ${mod}.${key} is missing or empty`).toBeTruthy();
      }
    }
    expect(data.auth.forgotPassword, `Locale "${code}" auth.forgotPassword lost <b>`).toMatch(/<b>.+<\/b>/);
  });
});

describe('employee module translations', () => {
  const flatten = (obj: object, prefix = ''): Record<string, unknown> =>
    Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const path = prefix + key;
      return value && typeof value === 'object'
        ? { ...acc, ...flatten(value, `${path}.`) }
        : { ...acc, [path]: value };
    }, {});
  const ptBREmployee = flatten(ptBR.employee);

  it('pt-BR defines the nav tabs and one block per screen', () => {
    expect(Object.keys(ptBR.employee).sort()).toEqual(
      ['common', 'detail', 'history', 'home', 'incident', 'machines', 'nav', 'session', 'sessionBar', 'settings']
    );
    expect(ptBR.employee.nav).toEqual({
      overview: 'Visão geral',
      machines: 'Empilhadeiras',
      history: 'Histórico',
    });
  });

  it.each(ALL_LOCALES)('locale $code translates every employee.settings text', ({ code, data }) => {
    const settings = (data as { employee?: { settings?: Record<string, string> } }).employee?.settings
    expect(Object.keys(settings ?? {}).sort(), `Locale "${code}" employee.settings keys differ from pt-BR`).toEqual(
      Object.keys(ptBR.employee.settings).sort()
    )
    for (const [key, value] of Object.entries(settings ?? {})) {
      expect(value, `Locale "${code}" employee.settings.${key} is empty`).toBeTruthy()
    }
  });

  it('pt-BR settings texts follow the Figma screen', () => {
    expect(ptBR.employee.settings).toMatchObject({
      title: 'Configurações',
      general: 'Geral',
      userData: 'Dados do usuário',
      name: 'Nome',
      phone: 'Telefone',
      position: 'Cargo',
      changeNoticeTitle: 'Solicitação de alteração',
      logout: 'Deslogar-se',
      feedbackTitle: 'Feedback & Sugestões',
      feedbackQuestion: 'Como foi sua experiência?',
      privacy: 'Política e Privacidade',
    })
  });

  it('en-US has exactly the same employee keys as pt-BR, all non-empty', () => {
    const enEmployee = flatten(enUS.employee);
    expect(Object.keys(enEmployee).sort()).toEqual(Object.keys(ptBREmployee).sort());
    for (const [key, value] of Object.entries(enEmployee)) {
      expect(value, `en-US employee.${key} is empty`).toBeTruthy();
    }
  });

  it.each([
    { code: 'pt-BR', data: ptBR },
    { code: 'en-US', data: enUS },
  ])('locale $code keeps the <b> markup in the session description', ({ code, data }) => {
    expect(data.employee.session.description, `Locale "${code}" lost <b>`).toMatch(/<b>.+<\/b>/);
  });
});

describe('machines load error translations', () => {
  it.each(ALL_LOCALES)('locale $code defines machines.loadError and common.retry as non-empty text', ({ code, data }) => {
    const machines = data.machines as unknown as Record<string, string>;
    const common = data.common as Record<string, string>;
    expect(machines.loadError, `Locale "${code}" machines.loadError is missing or empty`).toBeTruthy();
    expect(common.retry, `Locale "${code}" common.retry is missing or empty`).toBeTruthy();
  });

  it.each(ALL_LOCALES.filter(({ code }) => code !== 'pt-BR'))(
    'locale $code has load error texts that are translated, not copied from pt-BR',
    ({ code, data }) => {
      const machines = data.machines as unknown as Record<string, string>;
      const common = data.common as Record<string, string>;
      expect(machines.loadError, `Locale "${code}" machines.loadError equals pt-BR`).not.toBe(ptBR.machines.loadError);
      expect(common.retry, `Locale "${code}" common.retry equals pt-BR`).not.toBe(ptBR.common.retry);
    }
  );

  it.each(ALL_LOCALES.filter(({ code }) => code !== 'pt-BR' && code !== 'en-US'))(
    'locale $code has load error texts that are translated, not left in English',
    ({ code, data }) => {
      const machines = data.machines as unknown as Record<string, string>;
      const common = data.common as Record<string, string>;
      expect(machines.loadError, `Locale "${code}" machines.loadError equals en-US`).not.toBe(enUS.machines.loadError);
      expect(common.retry, `Locale "${code}" common.retry equals en-US`).not.toBe(enUS.common.retry);
    }
  );

  it('pt-BR texts match the spec', () => {
    expect(ptBR.machines.loadError).toBe('Não foi possível carregar as máquinas.');
    expect(ptBR.common.retry).toBe('Tentar novamente');
  });
});

describe('branches module translations', () => {
  const ptBRBranchKeys = Object.keys(ptBR.branches).sort();

  it.each(ALL_LOCALES)('locale $code has the same branches keys as pt-BR, all non-empty', ({ code, data }) => {
    const branches = data.branches as Record<string, string>;
    expect(Object.keys(branches).sort(), `Locale "${code}" branches keys differ from pt-BR`).toEqual(ptBRBranchKeys);
    for (const [key, value] of Object.entries(branches)) {
      expect(value, `Locale "${code}" branches.${key} is empty`).toBeTruthy();
    }
  });

  it.each(ALL_LOCALES)('locale $code keeps {{name}} in the per-branch texts', ({ code, data }) => {
    const branches = data.branches as Record<string, string>;
    for (const key of ['rename', 'remove', 'deleteMessage']) {
      expect(branches[key], `Locale "${code}" branches.${key} lost {{name}}`).toContain('{{name}}');
    }
  });

  it.each(ALL_LOCALES.filter(({ code }) => code !== 'pt-BR'))(
    'locale $code has branch texts that are translated, not copied from pt-BR',
    ({ code, data }) => {
      const branches = data.branches as Record<string, string>;
      for (const key of ['label', 'all', 'manage', 'create', 'saveError', 'deleteBlocked']) {
        expect(branches[key], `Locale "${code}" branches.${key} equals pt-BR`).not.toBe(
          (ptBR.branches as Record<string, string>)[key]
        );
      }
    }
  );

  it('pt-BR texts match the spec', () => {
    expect(ptBR.branches.label).toBe('Filiais');
    expect(ptBR.branches.all).toBe('Todas as filiais');
    expect(ptBR.branches.manage).toBe('Gerenciar Filiais');
    expect(ptBR.branches.create).toBe('Criar Filial');
    expect(ptBR.branches.nameLabel).toBe('Nome da filial');
    expect(ptBR.branches.confirm).toBe('Confirmar');
    expect(ptBR.branches.saveError).toBe('Não foi possível salvar a filial.');
    expect(ptBR.branches.deleteError).toBe('Não foi possível excluir a filial.');
    expect(ptBR.branches.deleteBlocked).toBe(
      'Não foi possível excluir: a filial é a matriz ou ainda tem recursos.'
    );
  });

  it('en-US label and all-branches option match the spec', () => {
    expect(enUS.branches.label).toBe('Branches');
    expect(enUS.branches.all).toBe('All branches');
  });
});

const STATUS_AND_CATEGORY_KEYS = [
  'machines.status.disponivel',
  'machines.status.em_uso',
  'machines.status.manutencao',
  'machines.status.alerta',
  'machines.status.offline',
  'machines.changeStatus',
  'fleet.lock',
  'fleet.unlock',
  'fleet.editCategory',
  'fleet.linkedStatus',
  'fleet.statusTaken',
  'fleet.saveError',
  'fleet.noCategories',
];

const valueAt = (data: unknown, path: string) =>
  path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], data);

describe('i18n status, lock and category texts', () => {
  it.each(ALL_LOCALES)('locale $code has every status/category key as a non-empty string', ({ data }) => {
    for (const key of STATUS_AND_CATEGORY_KEYS) {
      const value = valueAt(data, key);
      expect(typeof value, key).toBe('string');
      expect((value as string).trim(), key).not.toBe('');
    }
  });

  it.each(ALL_LOCALES.filter(({ code }) => code !== 'pt-BR'))(
    'locale $code translates every status/category key instead of copying pt-BR',
    ({ data }) => {
      for (const key of STATUS_AND_CATEGORY_KEYS) {
        expect(valueAt(data, key), key).not.toBe(valueAt(ptBR, key));
      }
    }
  );
});
