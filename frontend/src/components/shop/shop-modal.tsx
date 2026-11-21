'use client';

import { AvatarHatImage, avatarHats } from '@/components/avatar';
import { useShop } from '@/components/shop/shop-context';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ShopModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ShopModal = ({ open, onOpenChange }: ShopModalProps) => {
  const t = useTranslations('components.rewards');
  const { boughtHats, buyHat } = useShop();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="!left-2 !top-2 !h-[calc(100dvh-1rem)] !max-h-none !w-[calc(100%-1rem)] !max-w-none !translate-x-0 !translate-y-0 rounded-xl p-5 sm:max-w-none"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-950">{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <h3 className="mb-4 text-sm font-semibold text-grey-600">{t('category-hats')}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {avatarHats.map((hat) => {
              const isBought = boughtHats.includes(hat);

              return (
                <article
                  key={hat}
                  className={
                    isBought
                      ? 'flex min-h-64 flex-col rounded-xl border border-green-600 bg-green-50 p-3'
                      : 'flex min-h-64 flex-col rounded-xl border border-blue-100 bg-white p-3'
                  }
                >
                  <div className="relative flex min-h-40 flex-1 items-center justify-center rounded-lg bg-blue-50">
                    <AvatarHatImage hat={hat} className="h-40 w-40" />
                    {isBought && (
                      <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-green-600 text-white">
                        <Check className="size-5" aria-hidden />
                        <span className="sr-only">{t('owned')}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex justify-between gap-2 flex-col">
                    <span className="text-sm font-semibold text-blue-950">{t('hat', { number: hat })}</span>
                    <Button
                      size="sm"
                      variant={isBought ? 'ghost' : 'solid'}
                      disabled={isBought}
                      onClick={() => buyHat(hat)}
                    >
                      {isBought ? t('owned') : t('buy', { price: 500 })}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
