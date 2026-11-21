'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SimulationEventSummary } from './types';

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

const EVENT_TAGS: Record<string, { label: string; color: string }> = {
  gfc_2008: { label: 'Lehman Brothers & Hossa', color: 'bg-red-100 text-red-800' },
  covid_2020: { label: 'Lockdown & Boom Tech', color: 'bg-purple-100 text-purple-800' },
  inflation_2022: { label: 'Inflacja & Stopy %', color: 'bg-amber-100 text-amber-800' },
};

export const EventSelector: React.FC<EventSelectorProps> = ({ events, onSelectEvent, isLoading }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* First Tile (Hero card) - Solid background, NO gradient */}
      <div className="relative overflow-hidden bg-blue-500 rounded-2xl p-5 text-white shadow-xs">
        <div className="relative z-10 max-w-[70%]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs mb-2">
            <span>🦈</span> Robert Biznesu poleca
          </div>
          <h2 className="text-xl font-bold leading-tight mb-1">Symulator Giełdowy</h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            Zarządzaj portfelem w realnych, historycznych kryzysach. Sprawdź, czy pokonasz inflację i ocalisz kapitał!
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-white/15 px-2.5 py-1.5 rounded-lg w-fit">
            <span>Kapitał startowy:</span>
            <span className="text-yellow-300 font-bold">10 000 zł</span>
          </div>
        </div>

        {/* Mascot Shark */}
        <div className="absolute -bottom-2 -right-4 w-28 h-36 pointer-events-none">
          <Image
            src="/img/shark.png"
            alt="Robert Biznesu"
            width={120}
            height={150}
            className="object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* Scenarios Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-blue-950">Wybierz Realny scenariusz</h3>
          <span className="text-xs text-grey-600 font-medium">{events.length} scenariusze</span>
        </div>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {events.map((ev) => {
          const shortTitle = SHORT_EVENT_TITLES[ev.id] || ev.title;
          const tag = EVENT_TAGS[ev.id] || { label: 'Scenariusz', color: 'bg-blue-100 text-blue-800' };
          const isExpanded = !!expandedIds[ev.id];

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl p-4 border border-blue-100 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col gap-2.5 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-1 ${tag.color}`}>
                    {tag.label}
                  </span>
                  <h4 className="font-bold text-sm text-blue-950 leading-snug">{shortTitle}</h4>
                </div>
              </div>

              {/* Description with 2-line clamp & expand/collapse toggle */}
              <div>
                <p
                  className={`text-xs text-grey-600 leading-relaxed ${
                    isExpanded ? '' : 'line-clamp-2'
                  }`}
                >
                  {ev.initial_context?.description || 'Historyczna symulacja rynkowa.'}
                </p>
                <button
                  type="button"
                  onClick={() => toggleExpand(ev.id)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 mt-1 inline-block cursor-pointer"
                >
                  {isExpanded ? 'Zwiń' : 'Rozwiń'}
                </button>
              </div>

              {/* Footer with period and quarters without calendar/quarter icons */}
              <div className="flex items-center justify-between text-xs text-grey-600 pt-2 border-t border-grey-100">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-grey-600">
                    {ev.period}
                  </span>
                  <span className="font-medium text-blue-950">
                    {ev.total_quarters} kwartałów
                  </span>
                </div>
                <button
                  onClick={() => onSelectEvent(ev)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                >
                  Zagraj ➔
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
