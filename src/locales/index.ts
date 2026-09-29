import { Language } from '../types';
import { LanguageOption, Translations } from './types';
import { en } from './en';
import { bn } from './bn';
import { es } from './es';
import { hi } from './hi';
import { ar } from './ar';

export { en, bn, es, hi, ar };
export * from './types';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
  {
    code: 'bn',
    label: 'Bangla',
    nativeLabel: 'বাংলা',
    flag: '🇧🇩',
    dir: 'ltr',
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
  },
];

export const translations: Record<Language, Translations> = {
  en,
  bn,
  es,
  hi,
  ar,
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};

export const getLanguageOption = (lang: Language): LanguageOption => {
  return LANGUAGE_OPTIONS.find((opt) => opt.code === lang) || LANGUAGE_OPTIONS[0];
};
