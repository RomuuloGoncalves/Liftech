import { useTranslation } from 'react-i18next';
import { VALID_LANGUAGES, type SupportedLanguage } from '../types/i18n';

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGES_DATA: Record<SupportedLanguage, { nativeLabel: string; flag: string }> = {
  'pt-BR': { nativeLabel: 'Português (Brasil)', flag: '🇧🇷' },
  'en-US': { nativeLabel: 'English', flag: '🇺🇸' },
  'es': { nativeLabel: 'Español', flag: '🇪🇸' },
  'fr': { nativeLabel: 'Français', flag: '🇫🇷' },
  'ja': { nativeLabel: '日本語', flag: '🇯🇵' },
  'de': { nativeLabel: 'Deutsch', flag: '🇩🇪' },
  'ru': { nativeLabel: 'Русский', flag: '🇷🇺' }
};

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    if (VALID_LANGUAGES.includes(code as SupportedLanguage)) {
      i18n.changeLanguage(code);
      localStorage.setItem('liftech-lang', code);
    }
  };

  const languages: LanguageOption[] = VALID_LANGUAGES.map((code) => ({
    code,
    label: `languages.${code}`,
    nativeLabel: LANGUAGES_DATA[code].nativeLabel,
    flag: LANGUAGES_DATA[code].flag
  }));

  return {
    language: i18n.language,
    changeLanguage,
    languages
  };
}
