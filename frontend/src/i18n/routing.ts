import { defineRouting } from 'next-intl/routing';

export const DEFAULT_LOCALE = 'pl';

export const routing = defineRouting({
  locales: ['pl'],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: {
    mode: 'as-needed',
  },
});
