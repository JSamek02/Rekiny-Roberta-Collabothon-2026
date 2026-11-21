import { AppLocale } from '@/i18n/types';

// Fallback declarations if Next.js typegen hasn't run yet
export type AppRoutes = string;
export type ParamMap = Record<string, Record<string, string>>;

export type SearchParam = string | string[] | undefined;
export type AnySearchParams = { [key: string]: SearchParam };

export type AppPageProps<AppRoute extends string = string, SearchParams = AnySearchParams> = Readonly<{
  params: Promise<Record<string, string> & { locale: AppLocale }>;
  searchParams: Promise<SearchParams>;
}>;
