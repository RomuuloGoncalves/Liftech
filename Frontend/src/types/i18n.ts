export const VALID_LANGUAGES = ['pt-BR', 'en-US', 'es', 'fr', 'ja', 'de', 'ru'] as const;

export type SupportedLanguage = typeof VALID_LANGUAGES[number];
