import { defineRouting } from 'next-intl/routing';

export const DEFAULT_LOCALE = 'en';

export const routing = defineRouting({
  locales: ['pl', 'en'],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: {
    mode: 'as-needed',
  },
});
