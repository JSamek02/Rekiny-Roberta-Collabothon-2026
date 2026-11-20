'use client';

import React from 'react';
import { AssetAllocations, AssetKey } from './types';

interface AllocationSlidersProps {
  allocations: AssetAllocations;
  onChange: (allocations: AssetAllocations) => void;
  isInitial?: boolean;
  disabled?: boolean;
}

const ASSET_CONFIG: Record<
  AssetKey,
  {
    name: string;
    subname: string;
    icon: string;
    color: string;
    barColor: string;
    textColor: string;
    description: string;
  }
> = {
  stocks: {
    name: 'Akcje (S&P 500)',
    subname: 'Indeks 500 największych spółek USA',
    icon: '📈',
    color: 'bg-blue-500',
    barColor: '#3b5cff',
    textColor: 'text-blue-600',
    description: 'Wysoki potencjał wzrostu, ale duża zmienność w bessie.',
  },
  bonds: {
    name: 'Obligacje Skarbowe 10Y',
    subname: '10-letnie obligacje rządowe USA',
    icon: '📜',
    color: 'bg-emerald-500',
    barColor: '#10b981',
    textColor: 'text-emerald-600',
    description: 'Stabilne odsetki i tradycyjna ochrona podczas krachów akcji.',
  },
  gold: {
    name: 'Złoto Kruszcowe',
    subname: 'Fizyczne złoto spot w USD',
    icon: '🪙',
    color: 'bg-amber-500',
    barColor: '#f59e0b',
    textColor: 'text-amber-600',
    description: 'Ochrona przed dewaluacją walut, inflacją i szokami geopolitycznymi.',
  },
  cash: {
    name: 'Bezpieczna Gotówka',
    subname: '3-miesięczne bony skarbowe (T-Bill)',
    icon: '💵',
    color: 'bg-slate-500',
    barColor: '#64748b',
    textColor: 'text-slate-600',
    description: '100% płynności i zero ryzyka spadku nominalnego, ale traci na inflacji.',
  },
};

const PRESETS: Array<{ name: string; alloc: AssetAllocations }> = [
  {
    name: '60/40 Klasyk',
    alloc: { stocks: 0.6, bonds: 0.4, gold: 0.0, cash: 0.0 },
  },
  {
    name: 'All-Weather (Dalio)',
    alloc: { stocks: 0.3, bonds: 0.4, gold: 0.15, cash: 0.15 },
  },
  {
    name: '100% Akcje (Agresywny)',
    alloc: { stocks: 1.0, bonds: 0.0, gold: 0.0, cash: 0.0 },
  },
  {
    name: 'Defensywny / Tarcza',
    alloc: { stocks: 0.15, bonds: 0.35, gold: 0.3, cash: 0.2 },
  },
  {
    name: 'Czysta Gotówka',
    alloc: { stocks: 0.0, bonds: 0.0, gold: 0.0, cash: 1.0 },
  },
];

export const AllocationSliders: React.FC<AllocationSlidersProps> = ({
  allocations,
  onChange,
  isInitial = false,
  disabled = false,
}) => {
  // Sum percentage (rounded to 1 decimal)
  const totalPct = Math.round(
    (allocations.stocks + allocations.bonds + allocations.gold + allocations.cash) * 100
  );

  const handleSliderChange = (key: AssetKey, newPctVal: number) => {
    const val = Math.max(0, Math.min(100, newPctVal)) / 100;
    onChange({
      ...allocations,
      [key]: val,
    });
  };

  const normalizeTo100 = () => {
    const sum = allocations.stocks + allocations.bonds + allocations.gold + allocations.cash;
    if (sum <= 0) {
      onChange({ stocks: 0, bonds: 0, gold: 0, cash: 1.0 });
      return;
    }
    onChange({
      stocks: Math.round((allocations.stocks / sum) * 100) / 100,
      bonds: Math.round((allocations.bonds / sum) * 100) / 100,
      gold: Math.round((allocations.gold / sum) * 100) / 100,
      cash:
        Math.round(
          (1 -
            (Math.round((allocations.stocks / sum) * 100) / 100 +
              Math.round((allocations.bonds / sum) * 100) / 100 +
              Math.round((allocations.gold / sum) * 100) / 100)) *
            100
        ) / 100,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-blue-950">
            {isInitial ? 'Ustal Podział Kapitału na Start' : 'Dostosuj Alokację Portfela (Rebalancing)'}
          </h3>
          <p className="text-xs text-grey-600">Rozdziel 100% kapitału pomiędzy 4 klasy aktywów.</p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            totalPct === 100
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-red-100 text-red-800 animate-pulse'
          }`}
        >
          Suma: {totalPct}%
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-grey-200">
        <div
          style={{ width: `${Math.round(allocations.stocks * 100)}%`, backgroundColor: ASSET_CONFIG.stocks.barColor }}
          title={`Akcje: ${Math.round(allocations.stocks * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.bonds * 100)}%`, backgroundColor: ASSET_CONFIG.bonds.barColor }}
          title={`Obligacje: ${Math.round(allocations.bonds * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.gold * 100)}%`, backgroundColor: ASSET_CONFIG.gold.barColor }}
          title={`Złoto: ${Math.round(allocations.gold * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.cash * 100)}%`, backgroundColor: ASSET_CONFIG.cash.barColor }}
          title={`Gotówka: ${Math.round(allocations.cash * 100)}%`}
          className="transition-all duration-300"
        />
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-[11px] font-semibold text-grey-600 mb-1.5">Szybkie strategie inwestycyjne:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.alloc)}
              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-950 text-[11px] font-medium transition-colors border border-blue-100 active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders for each Asset */}
      <div className="flex flex-col gap-3 pt-1">
        {(Object.keys(ASSET_CONFIG) as AssetKey[]).map((key) => {
          const cfg = ASSET_CONFIG[key];
          const pct = Math.round(allocations[key] * 100);

          return (
            <div key={key} className="flex flex-col gap-1 p-2 rounded-xl bg-grey-50/50 border border-grey-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span>{cfg.icon}</span>
                  <span className="font-semibold text-blue-950">{cfg.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${cfg.textColor}`}>{pct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={disabled || pct <= 0}
                  onClick={() => handleSliderChange(key, pct - 5)}
                  className="w-6 h-6 rounded bg-white border border-grey-200 text-xs font-bold text-grey-600 hover:bg-blue-50 flex items-center justify-center disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  disabled={disabled}
                  value={pct}
                  onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-grey-200 rounded-lg"
                />
                <button
                  type="button"
                  disabled={disabled || pct >= 100}
                  onClick={() => handleSliderChange(key, pct + 5)}
                  className="w-6 h-6 rounded bg-white border border-grey-200 text-xs font-bold text-grey-600 hover:bg-blue-50 flex items-center justify-center disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <span className="text-[10px] text-grey-600 mt-0.5">{cfg.description}</span>
            </div>
          );
        })}
      </div>

      {totalPct !== 100 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <span>Suma musi wynosić 100% (obecnie {totalPct}%)</span>
          <button
            type="button"
            onClick={normalizeTo100}
            className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Wyrównaj
          </button>
        </div>
      )}
    </div>
  );
};
