'use client';

import { useShop } from '@/components/shop/shop-context';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui';
import { Sparkles, Star } from 'lucide-react';
import { type ReactNode } from 'react';

const COURSES: Array<{
  key: string;
  title: string;
  description: string;
  company?: string;
  icon: ReactNode;
}> = [
  {
    key: 'stocks-bonds',
    title: 'Stocks and Bonds',
    description: 'Learn how stocks and bonds work and how to balance risk in a portfolio.',
    icon: <BankIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'investing',
    title: 'Investing',
    description: 'Build practical investing skills, from diversification to long-term strategies.',
    icon: <DollarIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'budgeting',
    title: 'Budgeting',
    description: 'Plan income and expenses, create savings goals, and manage everyday spending.',
    icon: <WalletIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'economics',
    title: 'Economics',
    description: 'Understand markets, inflation, interest rates, and the wider economy.',
    icon: <HandCoinsIcon className="text-2xl" strokeWidth={1.5} />,
  },
  {
    key: 'taxes',
    title: 'Taxes',
    description: 'Explore tax basics, deductions, and how to make sense of personal tax forms.',
    company: 'Tumbleweed co.',
    icon: <Sparkles className="size-6" strokeWidth={1.5} />,
  },
  {
    key: 'retirement',
    title: 'Retirement',
    description: 'Prepare for retirement with pension planning, saving habits, and future projections.',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="!left-2 !top-2 !h-[calc(100dvh-1rem)] !max-h-none !w-[calc(100%-1rem)] !max-w-none !translate-x-0 !translate-y-0 rounded-xl p-5"
      >
        <DialogHeader>
          <DialogTitle className="pr-10 text-xl font-semibold text-blue-950">Marketplace</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-3 -mr-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course) => {
              const isStarred = starredCourses.includes(course.key);
              return (
                <article
                  key={course.key}
                  className="flex min-h-32 gap-3 rounded-xl border border-blue-100 bg-white p-3"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-950">
                    {course.icon}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-semibold leading-tight text-blue-950">{course.title}</h3>
                    {course.company && (
                      <span className="mt-1 w-fit rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {course.company}
                      </span>
                    )}
                    <p className="text-xs leading-relaxed text-grey-600">{course.description}</p>
                  </div>
                  <Button
                    size="iconSm"
                    variant={isStarred ? 'solid' : 'ghost'}
                    aria-pressed={isStarred}
                    aria-label={`${isStarred ? 'Unstar' : 'Star'} ${course.title}`}
                    title={`${isStarred ? 'Unstar' : 'Star'} ${course.title}`}
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
