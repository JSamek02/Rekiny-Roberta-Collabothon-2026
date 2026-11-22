'use client';

import { AppLocale } from '@/i18n/types';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const languages: { locale: AppLocale; name: string }[] = [
  { locale: 'pl', name: 'Polski' },
  { locale: 'en', name: 'English' },
  { locale: 'de', name: 'Deutsch' },
];

function LanguageFlag({ locale }: { locale: AppLocale }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 16"
      className="h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-black/10"
    >
      {locale === 'pl' && (
        <>
          <path fill="#fff" d="M0 0h24v8H0z" />
          <path fill="#dc143c" d="M0 8h24v8H0z" />
        </>
      )}
      {locale === 'de' && (
        <>
          <path fill="#000" d="M0 0h24v16H0z" />
          <path fill="#d00" d="M0 5.33h24v5.34H0z" />
          <path fill="#ffce00" d="M0 10.67h24V16H0z" />
        </>
      )}
      {locale === 'en' && (
        <>
          <path fill="#012169" d="M0 0h24v16H0z" />
          <path d="m0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
          <path d="m0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="2" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}

export function LanguageSelect() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('pages.profile');
  const [isOpen, setIsOpen] = useState(false);
  const selectedLanguage = languages.find((language) => language.locale === locale);

  if (!selectedLanguage) {
    throw new Error(`Unsupported application locale: ${locale}`);
  }

  const changeLanguage = (nextLocale: AppLocale) => {
    setIsOpen(false);
    if (nextLocale !== locale) {
      router.replace(pathname, { locale: nextLocale });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t('change-language')}: ${selectedLanguage.name}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="absolute top-2 right-2 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-blue-950 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <LanguageFlag locale={selectedLanguage.locale} />
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        role="listbox"
        aria-label={t('change-language')}
        className="min-w-40 p-1"
      >
        {languages.map((language) => (
          <button
            key={language.locale}
            type="button"
            role="option"
            aria-selected={language.locale === locale}
            onClick={() => changeLanguage(language.locale)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none aria-selected:bg-blue-50 aria-selected:font-semibold"
          >
            <LanguageFlag locale={language.locale} />
            <span>{language.name}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
