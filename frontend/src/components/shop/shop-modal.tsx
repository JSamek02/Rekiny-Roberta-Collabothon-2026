'use client';

import { AvatarHatImage, avatarHats } from '@/components/avatar';
import { useShop } from '@/components/shop/shop-context';
import { ApiError } from '@/api/error-handler';
import { AUTH_QUERY_KEYS, apiPostShopPurchase } from '@/api/services/auth-service';
import { AuthUser } from '@/api/types/auth';
import { saveGuestSharkCoins, useSharkCoins } from '@/hooks/use-shark-coins';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const HAT_COST = 500;
const otherRewards = [
  { id: 'advice-discount', title: 'other-advice-discount', company: 'Tumbleweed co.', cost: 7500 },
  { id: 'account-bonus', title: 'other-account-bonus', company: 'Tumbleweed co.', cost: 6000 },
  { id: 'investment-webinar', title: 'other-investment-webinar', cost: 5000 },
] as const;

type ShopModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ShopModal = ({ open, onOpenChange }: ShopModalProps) => {
  const t = useTranslations('components.rewards');
  const { boughtHats, buyHat } = useShop();
  const { sharkCoins, isGuest, isLoading } = useSharkCoins();
  const queryClient = useQueryClient();
  const [buyingItem, setBuyingItem] = useState<string | null>(null);
  const [boughtOtherRewards, setBoughtOtherRewards] = useState<string[]>([]);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const purchaseItem = async (itemId: string, cost: number, onSuccess: () => void) => {
    setPurchaseError(null);
    setBuyingItem(itemId);

    try {
      if (isGuest) {
        if (sharkCoins < cost) {
          setPurchaseError(t('not-enough-coins'));
          return;
        }
        saveGuestSharkCoins(sharkCoins - cost);
      } else {
        const purchase = await apiPostShopPurchase({ item_id: itemId });
        queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEYS.currentUser, (current) =>
          current ? { ...current, shark_coins: purchase.shark_coins } : current,
        );
      }

      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setPurchaseError(t('not-enough-coins'));
      } else {
        console.error('Could not purchase shop item', error);
        setPurchaseError(t('purchase-error'));
      }
    } finally {
      setBuyingItem(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="!left-2 !top-2 !h-[calc(100dvh-1rem)] !max-h-none !w-[calc(100%-1rem)] !max-w-none !translate-x-0 !translate-y-0 rounded-xl p-5 sm:max-w-none"
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="text-xl font-semibold text-blue-950">{t('title')}</DialogTitle>
            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-950">
              <Image src="/img/SharkCoin.svg" alt="" width={24} height={24} />
              <span>{t('balance', { balance: isLoading ? '—' : sharkCoins.toLocaleString() })}</span>
            </div>
          </div>
        </DialogHeader>

        {purchaseError && (
          <p className="text-sm text-red-800" role="alert">
            {purchaseError}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-4 -mr-4">
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
                      disabled={isBought || isLoading || sharkCoins < HAT_COST || buyingItem !== null}
                      onClick={() => void purchaseItem(`hat-${hat}`, HAT_COST, () => buyHat(hat))}
                    >
                      {isBought
                        ? t('owned')
                        : buyingItem === `hat-${hat}`
                          ? t('purchasing')
                          : t('buy', { price: HAT_COST })}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <h3 className="mb-4 mt-8 text-sm font-semibold text-grey-600">{t('category-others')}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {otherRewards.map((reward) => {
              const isBought = boughtOtherRewards.includes(reward.id);

              return (
                <article
                  key={reward.id}
                  className={
                    isBought
                      ? 'flex min-h-64 flex-col rounded-xl border border-green-600 bg-green-50 p-3'
                      : 'flex min-h-64 flex-col rounded-xl border border-blue-100 bg-white p-3'
                  }
                >
                  <div className="relative flex min-h-40 flex-1 items-center justify-center rounded-lg bg-blue-50">
                    <ImageIcon className="size-10 text-grey-400" aria-hidden />
                    {isBought && (
                      <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-green-600 text-white">
                        <Check className="size-5" aria-hidden />
                        <span className="sr-only">{t('owned')}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold text-blue-950">{t(reward.title)}</span>
                    {'company' in reward && <span className="text-xs text-grey-600">{reward.company}</span>}
                  </div>
                  <Button
                    className="mt-2"
                    size="sm"
                    variant={isBought ? 'ghost' : 'solid'}
                    disabled={isBought || isLoading || sharkCoins < reward.cost || buyingItem !== null}
                    onClick={() =>
                      void purchaseItem(reward.id, reward.cost, () =>
                        setBoughtOtherRewards((current) => [...current, reward.id]),
                      )
                    }
                  >
                    {isBought
                      ? t('owned')
                      : buyingItem === reward.id
                        ? t('purchasing')
                        : t('buy', { price: reward.cost })}
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
