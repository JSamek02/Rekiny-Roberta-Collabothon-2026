import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}.json`)).default,
    },
    formats: {
      dateTime: {
        'weekday-long': {
          weekday: 'long',
        },
        'weekday-short': {
          weekday: 'short',
        },
        'digit-long': {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        },
      },
    },
  };
});
