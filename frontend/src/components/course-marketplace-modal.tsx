'use client';

import { useShop } from '@/components/shop/shop-context';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui';
import { Sparkles, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

const COURSES: Array<{
  key: string;
  translationKey: 'stocks-bonds' | 'investing' | 'budgeting' | 'economics' | 'taxes' | 'retirement';
  company?: string;
  icon: ReactNode;
}> = [
  {
    key: 'stocks-bonds',
    translationKey: 'stocks-bonds',
    icon: <BankIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'investing',
    translationKey: 'investing',
    icon: <DollarIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'budgeting',
    translationKey: 'budgeting',
    icon: <WalletIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'economics',
    translationKey: 'economics',
    icon: <HandCoinsIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'taxes',
    translationKey: 'taxes',
    company: 'Tumbleweed co.',
    icon: <Sparkles className="size-6" strokeWidth={1.5} />,
  },
  {
    key: 'retirement',
    translationKey: 'retirement',
    company: 'Tumbleweed co.',
    icon: <Star className="size-6" strokeWidth={1.5} />,
  },
];

type CourseMarketplaceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CourseMarketplaceModal = ({ open, onOpenChange }: CourseMarketplaceModalProps) => {
  const { starredCourses, toggleStarredCourse } = useShop();
  const t = useTranslations('components.course-marketplace');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="!left-2 !top-2 !h-[calc(100dvh-1rem)] !max-h-none !w-[calc(100%-1rem)] !max-w-none !translate-x-0 !translate-y-0 rounded-xl p-5"
      >
        <DialogHeader>
          <DialogTitle className="pr-10 text-xl font-semibold text-blue-950">{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-3 -mr-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course) => {
              const isStarred = starredCourses.includes(course.key);
              const title = t(`courses.${course.translationKey}.title`);
              const description = t(`courses.${course.translationKey}.description`);
              return (
                <article
                  key={course.key}
                  className="flex min-h-32 gap-3 rounded-xl border border-blue-100 bg-white p-3"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-950">
                    {course.icon}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-semibold leading-tight text-blue-950">{title}</h3>
                    {course.company && (
                      <span className="mt-1 w-fit rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {t('company')}
                      </span>
                    )}
                    <p className="text-xs leading-relaxed text-grey-600">{description}</p>
                  </div>
                  <Button
                    size="iconSm"
                    variant={isStarred ? 'solid' : 'ghost'}
                    aria-pressed={isStarred}
                    aria-label={isStarred ? t('unstar', { title }) : t('star', { title })}
                    title={isStarred ? t('unstar', { title }) : t('star', { title })}
                    onClick={() => toggleStarredCourse(course.key)}
                  >
                    <Star className="size-5" strokeWidth={1.5} fill={isStarred ? 'currentColor' : 'none'} />
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
