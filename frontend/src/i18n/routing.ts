import { defineRouting } from 'next-intl/routing';

export const DEFAULT_LOCALE = 'en';

export const routing = defineRouting({
  locales: ['pl', 'en', 'de'],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: {
    mode: 'as-needed',
  },
});
