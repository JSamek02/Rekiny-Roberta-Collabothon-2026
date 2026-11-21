'use client';

import React from 'react';
import { AssetAllocations, AssetKey } from './types';
import { TrendingUp, Landmark, Coins, Banknote, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AllocationSlidersProps {
  allocations: AssetAllocations;
  onChange: (allocations: AssetAllocations) => void;
  isInitial?: boolean;
  disabled?: boolean;
}

const ASSET_CONFIG: Record<
  AssetKey,
  {
    icon: React.ComponentType<{ className?: string }>;
    barColor: string;
    textColor: string;
  }
> = {
  stocks: {
    icon: TrendingUp,
    barColor: '#3b5cff',
    textColor: 'text-blue-500',
  },
  bonds: {
    icon: Landmark,
    barColor: '#10b981',
    textColor: 'text-[#10b981]',
  },
  gold: {
    icon: Coins,
    barColor: '#f59e0b',
    textColor: 'text-[#f59e0b]',
  },
  cash: {
    icon: Banknote,
    barColor: '#64748b',
    textColor: 'text-[#64748b]',
  },
};

const PRESETS: Array<{ key: string; alloc: AssetAllocations }> = [
  {
    key: 'classic-60-40',
    alloc: { stocks: 0.6, bonds: 0.4, gold: 0.0, cash: 0.0 },
  },
  {
    key: 'all-weather',
    alloc: { stocks: 0.3, bonds: 0.4, gold: 0.15, cash: 0.15 },
  },
  {
    key: 'aggressive-100-stocks',
    alloc: { stocks: 1.0, bonds: 0.0, gold: 0.0, cash: 0.0 },
  },
  {
    key: 'defensive-shield',
    alloc: { stocks: 0.15, bonds: 0.35, gold: 0.3, cash: 0.2 },
  },
  {
    key: 'pure-cash',
    alloc: { stocks: 0.0, bonds: 0.0, gold: 0.0, cash: 1.0 },
  },
];

export const AllocationSliders: React.FC<AllocationSlidersProps> = ({
  allocations,
  onChange,
  isInitial = false,
  disabled = false,
}) => {
  const t = useTranslations('components.stock.allocation-sliders');

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
            {t(isInitial ? 'title-initial' : 'title-rebalance')}
          </h3>
          <p className="text-xs text-grey-600">{t('subtitle')}</p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            totalPct === 100
              ? 'bg-green-50 text-green-800 border border-green-500/20'
              : 'bg-red-50 text-red-800 border border-red-300 animate-pulse'
          }`}
        >
          {t('sum', { total: totalPct })}
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-grey-200">
        <div
          style={{ width: `${Math.round(allocations.stocks * 100)}%`, backgroundColor: ASSET_CONFIG.stocks.barColor }}
          title={`${t('assets.stocks.name')}: ${Math.round(allocations.stocks * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.bonds * 100)}%`, backgroundColor: ASSET_CONFIG.bonds.barColor }}
          title={`${t('assets.bonds.name')}: ${Math.round(allocations.bonds * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.gold * 100)}%`, backgroundColor: ASSET_CONFIG.gold.barColor }}
          title={`${t('assets.gold.name')}: ${Math.round(allocations.gold * 100)}%`}
          className="transition-all duration-300"
        />
        <div
          style={{ width: `${Math.round(allocations.cash * 100)}%`, backgroundColor: ASSET_CONFIG.cash.barColor }}
          title={`${t('assets.cash.name')}: ${Math.round(allocations.cash * 100)}%`}
          className="transition-all duration-300"
        />
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-[11px] font-semibold text-grey-600 mb-1.5">{t('quick-strategies')}</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.alloc)}
              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-950 text-[11px] font-medium transition-colors border border-blue-100 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {t(`presets.${p.key}` as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders for each Asset */}
      <div className="flex flex-col gap-3 pt-1">
        {(Object.keys(ASSET_CONFIG) as AssetKey[]).map((key) => {
          const cfg = ASSET_CONFIG[key];
          const Icon = cfg.icon;
          const pct = Math.round(allocations[key] * 100);

          return (
            <div key={key} className="flex flex-col gap-1 p-2 rounded-xl bg-grey-50/50 border border-grey-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${cfg.textColor}`} />
                  <span className="font-semibold text-blue-950">{t(`assets.${key}.name` as any)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${cfg.textColor}`}>{pct}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={disabled || pct <= 0}
                  onClick={() => handleSliderChange(key, pct - 5)}
                  className="w-6 h-6 rounded bg-white border border-grey-200 text-xs font-bold text-grey-600 hover:bg-blue-50 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  aria-label="Decrease percentage"
                >
                  <Minus className="w-3 h-3" />
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
                  className="w-6 h-6 rounded bg-white border border-grey-200 text-xs font-bold text-grey-600 hover:bg-blue-50 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  aria-label="Increase percentage"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[10px] text-grey-600 mt-0.5">{t(`assets.${key}.description` as any)}</span>
            </div>
          );
        })}
      </div>

      {totalPct !== 100 && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800">
          <span>{t('sum-error', { total: totalPct })}</span>
          <button
            type="button"
            onClick={normalizeTo100}
            className="px-2.5 py-1 bg-[#ef4444] text-white rounded text-xs font-semibold hover:bg-[#dc2626] transition-colors cursor-pointer"
          >
            {t('normalize-btn')}
          </button>
        </div>
      )}
    </div>
  );
};
