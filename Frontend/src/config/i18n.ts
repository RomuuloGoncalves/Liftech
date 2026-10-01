import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { VALID_LANGUAGES } from '../types/i18n';

import ptBR from '../locales/pt-BR/translation.json';
import enUS from '../locales/en-US/translation.json';
import es from '../locales/es/translation.json';
import fr from '../locales/fr/translation.json';
import ja from '../locales/ja/translation.json';
import de from '../locales/de/translation.json';
import ru from '../locales/ru/translation.json';

const getInitialLanguage = (): string => {
  const savedLang = localStorage.getItem('liftech-lang');
  if (savedLang && (VALID_LANGUAGES as readonly string[]).includes(savedLang)) {
    return savedLang;
  }
  return 'pt-BR';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es': { translation: es },
      'fr': { translation: fr },
      'ja': { translation: ja },
      'de': { translation: de },
      'ru': { translation: ru }
    },
    lng: getInitialLanguage(),
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    initAsync: false,
  });

export default i18n;
