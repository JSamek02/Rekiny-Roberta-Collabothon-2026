import { AppLocale } from '@/i18n/types';
import { AppRoutes, ParamMap } from '../../.next/types/routes';

export type SearchParam = string | string[] | undefined;
export type AnySearchParams = { [key: string]: SearchParam };

export type AppPageProps<AppRoute extends AppRoutes = AppRoutes, SearchParams = AnySearchParams> = Readonly<{
  params: Promise<Omit<ParamMap[AppRoute], 'locale'> & { locale: AppLocale }>;
  searchParams: Promise<SearchParams>;
}>;
