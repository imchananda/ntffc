import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import th from './locales/th.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  th: { translation: th },
  en: { translation: en },
  zh: { translation: zh }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'th',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
