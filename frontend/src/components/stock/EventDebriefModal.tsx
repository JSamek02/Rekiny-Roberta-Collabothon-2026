'use client';

import React from 'react';
import Image from 'next/image';
import { SimulationDebrief, SimulationSession } from './types';
import { Trophy, ShieldCheck, TrendingUp, Sparkles, Award, RotateCcw, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSharkCoins } from '@/hooks/use-shark-coins';
import { Dialog, DialogContent, DialogTitle } from '@/ui';

interface EventDebriefModalProps {
  debrief: SimulationDebrief;
  eventTitle: string;
  eventId?: string;
  onRestart: () => void;
  onChooseOther: () => void;
}

const BADGE_MAP: Record<string, { key: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Tarcza Bezpieczeństwa': { key: 'shield', icon: ShieldCheck },
  'Pogromca Inflacji': { key: 'inflation', icon: TrendingUp },
  'Diamentowe Płetwy': { key: 'diamond', icon: Sparkles },
};

export const EventDebriefModal: React.FC<EventDebriefModalProps> = ({
  debrief,
  eventTitle,
  eventId,
  onRestart,
  onChooseOther,
}) => {
  const t = useTranslations('components.stock.debrief');
  const { handleInvestmentProfit } = useSharkCoins();

  React.useEffect(() => {
    const coins = debrief.sharcoins_awarded ?? 0;
    if (coins > 0 && eventId) {
      handleInvestmentProfit(coins, {
        event_id: eventId,
        status: 'completed',
        debrief,
      } as unknown as SimulationSession);
    }
  }, [debrief, eventId, handleInvestmentProfit]);

  const isProfit = debrief.nominal_return_pct >= 0;
  const isRealProfit = debrief.real_return_pct >= 0;
  const coinsAwarded = debrief.sharcoins_awarded ?? 0;

  const verdictMessage =
    (debrief.robert_verdict?.mood && t.has(`verdicts.${debrief.robert_verdict.mood}` as any)
      ? t(`verdicts.${debrief.robert_verdict.mood}` as any)
      : null) || debrief.robert_verdict?.message;

  const localizedTakeaways = React.useMemo(() => {
    const list: string[] = [];
    const absDd = Math.abs(debrief.max_drawdown_pct);
    const tAny = t as any;
    if (debrief.max_drawdown_pct > -15.0) {
      if (t.has('takeaways.drawdown-safe' as any)) {
        list.push(tAny('takeaways.drawdown-safe', { absDd }));
      }
    } else {
      if (t.has('takeaways.drawdown-deep' as any)) {
        list.push(tAny('takeaways.drawdown-deep', { absDd }));
      }
    }

    if (debrief.real_return_pct > 0) {
      if (t.has('takeaways.inflation-beat' as any)) {
        list.push(tAny('takeaways.inflation-beat', { realPct: debrief.real_return_pct }));
      }
    } else {
      if (t.has('takeaways.inflation-lost' as any)) {
        list.push(tAny('takeaways.inflation-lost'));
      }
    }

    if (debrief.rebalances_count === 0) {
      if (t.has('takeaways.rebalance-none' as any)) {
        list.push(tAny('takeaways.rebalance-none'));
      }
    } else {
      if (t.has('takeaways.rebalance-active' as any)) {
        list.push(tAny('takeaways.rebalance-active', { count: debrief.rebalances_count }));
      }
    }

    return list.length === 3 ? list : debrief.educational_takeaways;
  }, [debrief, t]);

  return (
    <Dialog open>
      <DialogContent showCloseButton={false}>
        {/* Trophy & Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center shadow-md mb-2">
            <Trophy className="w-8 h-8 text-[#f59e0b]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{t('crisis-completed')}</span>
          <DialogTitle className="text-lg font-bold text-blue-950 mt-0.5">{eventTitle}</DialogTitle>
        </div>

      {/* Rewards Banner */}
      <div className="flex items-center justify-center gap-6 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
        <div className="flex items-center gap-1.5">
          <Image src="/img/green-gem.svg" alt="" width={22} height={22} />
          <span className="text-xs font-bold text-green-800">+{debrief.xp_awarded || 300} XP</span>
        </div>
        <div className="h-4 w-px bg-blue-200" />
        <div className="flex items-center gap-1.5">
          <Image src="/img/coin.svg" alt="" width={22} height={22} />
          <span className="text-xs font-bold text-amber-800">+{coinsAwarded.toLocaleString()} SharkCoins</span>
        </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-grey-50 border border-grey-100">
          <span className="text-grey-600 block text-[11px]">{t('final-capital')}</span>
          <span className="text-base font-bold text-blue-950">
            {debrief.final_capital.toLocaleString(undefined, { minimumFractionDigits: 2 })} zł
          </span>
          <span className={`text-[11px] font-bold block mt-0.5 ${isProfit ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {t('nominal-return', { prefix: isProfit ? '+' : '', value: debrief.nominal_return_pct })}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-grey-50 border border-grey-100">
          <span className="text-grey-600 block text-[11px]">{t('real-capital')}</span>
          <span className="text-base font-bold text-blue-950">
            {debrief.real_capital.toLocaleString(undefined, { minimumFractionDigits: 2 })} zł
          </span>
          <span className={`text-[11px] font-bold block mt-0.5 ${isRealProfit ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {t('real-return', { prefix: isRealProfit ? '+' : '', value: debrief.real_return_pct })}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-grey-50 border border-grey-100 col-span-2 flex items-center justify-between text-xs">
          <div>
            <span className="text-grey-600 text-[11px] block">{t('max-drawdown')}</span>
            <span className="font-bold text-[#ef4444] font-mono text-sm">{debrief.max_drawdown_pct}%</span>
          </div>
          <div className="text-right">
            <span className="text-grey-600 text-[11px] block">{t('rebalances-count')}</span>
            <span className="font-bold text-blue-950 font-mono text-sm">{debrief.rebalances_count}</span>
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      {debrief.badges_earned && debrief.badges_earned.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-blue-950 mb-2">{t('badges-title')}</h4>
          <div className="flex flex-col gap-1.5">
            {debrief.badges_earned.map((badgeName) => {
              const b = BADGE_MAP[badgeName];
              const Icon = b ? b.icon : Award;
              {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              }
              const displayName = b
                ? t.has(`badges.${b.key}.name` as any)
                  ? t(`badges.${b.key}.name` as any)
                  : badgeName
                : badgeName;
              {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              }
              const displayDesc = b ? t(`badges.${b.key}.desc` as any) : t('badges.default.desc');

              return (
                <div
                  key={badgeName}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50 border border-amber-300 text-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-300/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 block">{displayName}</span>
                    <span className="text-[10px] text-amber-800">{displayDesc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Robert Biznesu Verdict */}
      {debrief.robert_verdict && (
        <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-200">
          <div className="w-12 h-14 shrink-0 relative">
            <Image
              src="/img/shark.svg"
              alt="Robert Biznesu"
              width={48}
              height={56}
              className="object-contain drop-shadow"
            />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wide block">
              {t('verdict-title')}
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed mt-0.5">
              &ldquo;{verdictMessage}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Educational Takeaways */}
      {localizedTakeaways && localizedTakeaways.length > 0 && (
        <div className="bg-grey-50 p-3 rounded-xl border border-grey-100">
          <h4 className="text-xs font-bold text-blue-950 mb-1.5">{t('takeaways-title')}</h4>
          <ul className="flex flex-col gap-1.5 text-xs text-grey-700">
            {localizedTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span className="leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onRestart}
          className="flex-1 py-2.5 px-3 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('play-again')}</span>
        </button>
        <button
          onClick={onChooseOther}
          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{t('scenarios-list')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      </DialogContent>
    </Dialog>
  );
};
