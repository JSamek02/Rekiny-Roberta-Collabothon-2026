'use client';

import { AppLocale } from '@/i18n/types';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const languages: { locale: AppLocale; name: string; flag: string }[] = [
  { locale: 'pl', name: 'Polski', flag: '🇵🇱' },
  { locale: 'en', name: 'English', flag: '🇬🇧' },
  { locale: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

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
          <span aria-hidden="true" className="text-xl leading-none">{selectedLanguage.flag}</span>
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
            <span aria-hidden="true" className="text-xl leading-none">{language.flag}</span>
            <span>{language.name}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
