'use client';

import React from 'react';
import Image from 'next/image';
import { QuarterHistoryEntry } from './types';
import { TrendingUp, Landmark, Coins, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QuarterNewsCardProps {
  quarterData: QuarterHistoryEntry;
}

export const QuarterNewsCard: React.FC<QuarterNewsCardProps> = ({ quarterData }) => {
  const t = useTranslations('components.stock.quarter-news');

  const benchmarks = quarterData.benchmark_returns || {
    stocks: 0,
    bonds: 0,
    gold: 0,
    cash: 0,
  };

  const qReturn = quarterData.quarter_return_pct ?? 0;
  const isPositive = qReturn >= 0;

  const qKey = quarterData.quarter;
  const headline =
    (t.has(`quarters.${qKey}.headline` as any) ? t(`quarters.${qKey}.headline` as any) : null) ||
    quarterData.headline;
  const context =
    (t.has(`quarters.${qKey}.context` as any) ? t(`quarters.${qKey}.context` as any) : null) ||
    quarterData.context;
  const lesson =
    (t.has(`quarters.${qKey}.lesson` as any) ? t(`quarters.${qKey}.lesson` as any) : null) ||
    quarterData.lesson;

  return (
    <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-3 shadow-sm">
      {/* Quarter Header & Headline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
            {t('quarter-badge', { quarter: quarterData.quarter })}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isPositive ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {t('portfolio-return', { prefix: isPositive ? '+' : '', value: qReturn.toFixed(2) })}
          </span>
        </div>
        <h3 className="font-bold text-sm text-blue-950 leading-snug">{headline}</h3>
      </div>

      {/* Historical Context */}
      <p className="text-xs text-grey-600 leading-relaxed bg-blue-50/40 p-2.5 rounded-xl border border-blue-50">
        {context}
      </p>

      {/* Robert Biznesu Lesson */}
      {lesson && (
        <div className="flex items-start gap-2.5 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
          <div className="w-8 h-8 shrink-0 relative mt-0.5">
            <Image
              src="/img/shark.svg"
              alt="Robert Biznesu"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
              {t('robert-lesson')}
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">{lesson}</p>
          </div>
        </div>
      )}

      {/* Asset Returns Breakdown for This Quarter */}
      <div>
        <span className="text-[11px] font-semibold text-grey-600 mb-1.5 block">
          {t('asset-returns-title')}
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-grey-700">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('assets.stocks')}</span>
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.stocks >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {benchmarks.stocks >= 0 ? '+' : ''}
              {benchmarks.stocks?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-grey-700">
              <Landmark className="w-3.5 h-3.5 text-[#10b981]" />
              <span>{t('assets.bonds')}</span>
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.bonds >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {benchmarks.bonds >= 0 ? '+' : ''}
              {benchmarks.bonds?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-grey-700">
              <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>{t('assets.gold')}</span>
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.gold >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {benchmarks.gold >= 0 ? '+' : ''}
              {benchmarks.gold?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-grey-700">
              <Banknote className="w-3.5 h-3.5 text-[#64748b]" />
              <span>{t('assets.cash')}</span>
            </span>
            <span className="font-bold font-mono text-grey-700">
              +{benchmarks.cash?.toFixed(1)}%
            </span>
          </div>
        </div>

        {quarterData.quarter_cpi_pct !== undefined && (
          <div className="mt-1.5 flex items-center justify-between px-2 py-1 rounded bg-grey-100 text-[10px] text-grey-600">
            <span>{t('cpi-inflation')}</span>
            <span className="font-bold text-grey-700">
              {quarterData.quarter_cpi_pct >= 0 ? '+' : ''}
              {quarterData.quarter_cpi_pct.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
