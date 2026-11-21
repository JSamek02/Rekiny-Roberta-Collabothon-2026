'use client';

import React from 'react';
import Image from 'next/image';
import { QuarterHistoryEntry } from './types';

interface QuarterNewsCardProps {
  quarterData: QuarterHistoryEntry;
}

export const QuarterNewsCard: React.FC<QuarterNewsCardProps> = ({ quarterData }) => {
  const benchmarks = quarterData.benchmark_returns || {
    stocks: 0,
    bonds: 0,
    gold: 0,
    cash: 0,
  };

  const qReturn = quarterData.quarter_return_pct ?? 0;
  const isPositive = qReturn >= 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-3 shadow-sm">
      {/* Quarter Header & Headline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
            KWARTAŁ: {quarterData.quarter}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
          >
            Twój portfel: {isPositive ? '+' : ''}
            {qReturn.toFixed(2)}%
          </span>
        </div>
        <h3 className="font-bold text-sm text-blue-950 leading-snug">{quarterData.headline}</h3>
      </div>

      {/* Historical Context */}
      <p className="text-xs text-grey-600 leading-relaxed bg-blue-50/40 p-2.5 rounded-xl border border-blue-50">
        {quarterData.context}
      </p>

      {/* Robert Biznesu Lesson */}
      {quarterData.lesson && (
        <div className="flex items-start gap-2.5 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
          <div className="w-8 h-8 shrink-0 relative mt-0.5">
            <Image
              src="/img/shark.png"
              alt="Robert Biznesu"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
              Lekcja Roberta Biznesu:
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">{quarterData.lesson}</p>
          </div>
        </div>
      )}

      {/* Asset Returns Breakdown for This Quarter */}
      <div>
        <span className="text-[11px] font-semibold text-grey-600 mb-1.5 block">
          Stopy zwrotu klas aktywów w tym kwartale:
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-grey-700">
              <span>📈</span> Akcje
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.stocks >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {benchmarks.stocks >= 0 ? '+' : ''}
              {benchmarks.stocks?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-grey-700">
              <span>📜</span> Obligacje
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.bonds >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {benchmarks.bonds >= 0 ? '+' : ''}
              {benchmarks.bonds?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-grey-700">
              <span>🪙</span> Złoto
            </span>
            <span
              className={`font-bold font-mono ${
                benchmarks.gold >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {benchmarks.gold >= 0 ? '+' : ''}
              {benchmarks.gold?.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-grey-50 border border-grey-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-grey-700">
              <span>💵</span> Gotówka
            </span>
            <span className="font-bold font-mono text-grey-700">
              +{benchmarks.cash?.toFixed(1)}%
            </span>
          </div>
        </div>

        {quarterData.quarter_cpi_pct !== undefined && (
          <div className="mt-1.5 flex items-center justify-between px-2 py-1 rounded bg-grey-100 text-[10px] text-grey-600">
            <span>Inflacja CPI w tym kwartale:</span>
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
