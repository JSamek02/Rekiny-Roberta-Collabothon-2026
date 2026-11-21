import { getLocale } from 'next-intl/server';
import { ApiClient, ApiConfig } from '@/api/api';
import { DEFAULT_LOCALE, routing } from '@/i18n/routing';
import { AppLocale } from '@/i18n/types';

const getClientLocale = (): AppLocale => {
  const localeSegment = globalThis.window.location.pathname.split('/')[1] as AppLocale;
  return routing.locales.includes(localeSegment) ? localeSegment : DEFAULT_LOCALE;
};
const getServerLocale = getLocale;

const getApiLocale = globalThis.window ? getClientLocale : getServerLocale;

export const getApiClient = async (config?: ApiConfig) => {
  const locale = await getApiLocale();

  return new ApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    ...config,
    defaultHeaders: { 'Accept-Language': locale, ...config?.defaultHeaders },
  });
};
