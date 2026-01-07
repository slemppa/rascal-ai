import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fi from '../locales/fi/common.json'
import en from '../locales/en/common.json'

// i18next initialization with cookie-based language detection
// Force refresh 2026-01-07 v2
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fi: { common: fi },
      en: { common: en }
    },
    fallbackLng: 'fi',
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['cookie', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      cookieMinutes: 60 * 24 * 365, // 1 year
      cookieName: 'rascal.lang'
    },
    interpolation: {
      escapeValue: false
    }
  })

export default i18n


