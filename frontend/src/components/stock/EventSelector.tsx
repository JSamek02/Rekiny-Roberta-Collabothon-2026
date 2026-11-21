'use client';

import React, { useState } from 'react';
import { SimulationEventSummary } from './types';
import { StockMarketHeroWidget } from './StockMarketHeroWidget';
import { ArrowRight, Building2, Activity, Flame, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EventSelectorProps {
  events: SimulationEventSummary[];
  onSelectEvent: (event: SimulationEventSummary) => void;
  isLoading?: boolean;
}

export const SHORT_EVENT_TITLES: Record<string, string> = {
  gfc_2008: 'Kryzys Finansowy 2008',
  covid_2020: 'Krach COVID-19',
  inflation_2022: 'Szok Inflacyjny 2022',
};

const EVENT_TAGS: Record<string, { labelKey: string; color: string }> = {
  gfc_2008: { labelKey: 'gfc_2008', color: 'bg-red-100 text-red-800' },
  covid_2020: { labelKey: 'covid_2020', color: 'bg-purple-100 text-purple-800' },
  inflation_2022: { labelKey: 'inflation_2022', color: 'bg-amber-100 text-amber-800' },
};

interface EventDifficulty {
  diffKey: 'easy' | 'medium' | 'hard';
  icon: React.ComponentType<{ className?: string }>;
  bars: [string, string, string];
}

const EVENT_DIFFICULTY: Record<string, EventDifficulty> = {
  covid_2020: {
    diffKey: 'easy',
    icon: Activity,
    bars: ['#10b981', 'rgba(156, 163, 175, 0.3)', 'rgba(156, 163, 175, 0.3)'],
  },
  inflation_2022: {
    diffKey: 'medium',
    icon: Flame,
    bars: ['#f59e0b', '#f59e0b', 'rgba(156, 163, 175, 0.3)'],
  },
  gfc_2008: {
    diffKey: 'hard',
    icon: Building2,
    bars: ['#ef4444', '#ef4444', '#ef4444'],
  },
};

const DEFAULT_DIFFICULTY: EventDifficulty = {
  diffKey: 'medium',
  icon: TrendingUp,
  bars: ['#f59e0b', '#f59e0b', 'rgba(156, 163, 175, 0.3)'],
};

export const EventSelector: React.FC<EventSelectorProps> = ({ events, onSelectEvent, isLoading }) => {
  const t = useTranslations('components.stock.event-selector');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero card - Symulator Giełdowy */}
      <StockMarketHeroWidget isLink={false} />

      {/* Scenarios Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-blue-950">{t('heading')}</h3>
          <span className="text-xs text-grey-600 font-medium">
            {t('scenarios-count', { count: events.length })}
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {events.map((ev) => {
          const shortTitle =
            (t.has(`short-titles.${ev.id}` as any) ? t(`short-titles.${ev.id}` as any) : null) ||
            SHORT_EVENT_TITLES[ev.id] ||
            ev.title;
          const tagInfo = EVENT_TAGS[ev.id];
          const tagLabel = tagInfo
            ? (t.has(`tags.${tagInfo.labelKey}` as any) ? t(`tags.${tagInfo.labelKey}` as any) : null) || tagInfo.labelKey
            : t('tags.default');
          const tagColor = tagInfo?.color || 'bg-blue-100 text-blue-800';

          const diff = EVENT_DIFFICULTY[ev.id] || DEFAULT_DIFFICULTY;
          const diffLabel = t(`difficulty.${diff.diffKey}`);
          const DiffIcon = diff.icon;
          const isExpanded = !!expandedIds[ev.id];

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl p-4 border border-blue-100 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-2.5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1 ${tagColor}`}>
                    {tagLabel}
                  </span>
                  <h4 className="font-bold text-sm text-blue-950 leading-snug">{shortTitle}</h4>
                </div>

                {/* Right Top Corner: Difficulty + Topic Icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold text-grey-600 leading-none">
                      {diffLabel}
                    </span>
                    <div className="flex items-center gap-0.5" title={t('difficulty-label', { label: diffLabel })}>
                      {diff.bars.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-1 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-2xs">
                    <DiffIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Description with 2-line clamp & expand/collapse toggle */}
              <div>
                <p
                  className={`text-xs text-grey-600 leading-relaxed ${
                    isExpanded ? '' : 'line-clamp-2'
                  }`}
                >
                  {ev.initial_context?.description || t('fallback-desc')}
                </p>
                <button
                  type="button"
                  onClick={() => toggleExpand(ev.id)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 mt-1 inline-block cursor-pointer"
                >
                  {isExpanded ? t('collapse') : t('expand')}
                </button>
              </div>

              {/* Footer with period and quarters */}
              <div className="flex items-center justify-between text-xs text-grey-600 pt-2 border-t border-grey-100">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-grey-600">
                    {ev.period}
                  </span>
                  <span className="font-medium text-blue-950">
                    {t('quarters-count', { count: ev.total_quarters })}
                  </span>
                </div>
                <button
                  onClick={() => onSelectEvent(ev)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-blue-500 hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>{t('play')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
