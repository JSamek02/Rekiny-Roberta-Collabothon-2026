'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Contrast, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';

const CONTRAST_STORAGE_KEY = 'accessibility-contrast';
const CONTRAST_CHANGE_EVENT = 'accessibility-contrast-change';

const contrastModes = ['normal', 'black-white', 'black-yellow'] as const;
type ContrastMode = (typeof contrastModes)[number];

function isContrastMode(value: string | null): value is ContrastMode {
  return contrastModes.some((mode) => mode === value);
}

function applyContrastMode(mode: ContrastMode) {
  document.documentElement.dataset.contrast = mode;
}

function getContrastSnapshot(): ContrastMode {
  try {
    const storedMode = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
    return isContrastMode(storedMode) ? storedMode : 'normal';
  } catch (error) {
    console.error('Unable to read accessibility contrast setting', error);
    return 'normal';
  }
}

function subscribeToContrastChanges(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CONTRAST_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CONTRAST_CHANGE_EVENT, callback);
  };
}

export function ContrastSelect() {
  const t = useTranslations('pages.profile');
  const [isOpen, setIsOpen] = useState(false);
  const contrastMode = useSyncExternalStore(
    subscribeToContrastChanges,
    getContrastSnapshot,
    (): ContrastMode => 'normal',
  );

  const modes = [
    { value: 'normal', label: t('contrast.normal') },
    { value: 'black-white', label: t('contrast.black-white') },
    { value: 'black-yellow', label: t('contrast.black-yellow') },
  ] as const;
  const selectedMode = modes.find((mode) => mode.value === contrastMode);

  useEffect(() => {
    applyContrastMode(contrastMode);
  }, [contrastMode]);

  const selectMode = (mode: ContrastMode) => {
    try {
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Unable to save accessibility contrast setting', error);
      return;
    }

    applyContrastMode(mode);
    window.dispatchEvent(new Event(CONTRAST_CHANGE_EVENT));
    setIsOpen(false);
  };

  if (!selectedMode) {
    throw new Error(`Unsupported accessibility contrast mode: ${contrastMode}`);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t('contrast.label')}: ${selectedMode.label}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="absolute top-2 left-2 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 text-blue-950 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Contrast aria-hidden="true" className="size-4" />
          <span>{selectedMode.label}</span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        role="listbox"
        aria-label={t('contrast.label')}
        className="min-w-40 p-1"
      >
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="option"
            aria-selected={mode.value === contrastMode}
            onClick={() => selectMode(mode.value)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none aria-selected:bg-blue-50 aria-selected:font-semibold"
          >
            <Contrast aria-hidden="true" className="size-4" />
            <span>{mode.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
