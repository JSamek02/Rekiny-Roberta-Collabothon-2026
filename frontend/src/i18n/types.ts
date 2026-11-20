import { Messages, NamespaceKeys, NestedKeyOf, useTranslations } from 'next-intl';
import formats from '@/i18n/request';
import { routing } from '@/i18n/routing';
import messagesGlobal from '../messages/pl.json';

export type AppLocale = (typeof routing.locales)[number];

type KeyPath = NamespaceKeys<I18NMessages, NestedKeyOf<I18NMessages>>;
type UseTranslation<K extends KeyPath> = ReturnType<typeof useTranslations<K>>;

/**
 * Type for messages JSON files
 */
export type I18NMessages =  typeof messagesGlobal;

/**
 * Type for `t` function. Can be namespaced using generic type
 */
export type I18NT<T extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never> = ReturnType<
  typeof useTranslations<T>
>;

/**
 * For given translation path return all object keys for this nesting.\
 * This type is not fully type-safe - Use `I18NNestedKeys`
 */
type RawI18NNesting<Path extends string, T = I18NMessages> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? RawI18NNesting<Rest, T[Key]>
    : never
  : Path extends keyof T
    ? keyof T[Path]
    : never;

/** For given translation path return all object keys for this nesting. */
export type I18NNestedKeys<Path extends NestedKeyOf<I18NMessages>> = RawI18NNesting<Path>;

/** For given translation path return all object keys that aren't objects so can be translated */
export type I18NTranslationKeys<K extends KeyPath> = Parameters<UseTranslation<K>>[0];

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale;
    Messages: I18NMessages;
    Formats: typeof formats;
  }
}
