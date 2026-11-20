'use client';

import React from 'react';
import Image from 'next/image';
import { SimulationEventSummary } from './types';

interface EventSelectorProps {
  events: SimulationEventSummary[];
  onSelectEvent: (event: SimulationEventSummary) => void;
  isLoading?: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  gfc_2008: '🏛️',
  covid_2020: '🦠',
  inflation_2022: '⚡',
};

const EVENT_TAGS: Record<string, { label: string; color: string }> = {
  gfc_2008: { label: 'Upadek Lehman Brothers & Wielka Hossa', color: 'bg-red-100 text-red-800' },
  covid_2020: { label: 'Czarny Łabędź & Boom Technologiczny', color: 'bg-purple-100 text-purple-800' },
  inflation_2022: { label: 'Wysoka Inflacja & Szok Surowcowy', color: 'bg-amber-100 text-amber-800' },
};

export const EventSelector: React.FC<EventSelectorProps> = ({ events, onSelectEvent, isLoading }) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero card with Shark Mascot */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
        <div className="relative z-10 max-w-[70%]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
            <span>🦈</span> Robert Biznesu poleca
          </div>
          <h2 className="text-xl font-bold leading-tight mb-1">Symulator Giełdowy</h2>
          <p className="text-xs text-blue-100 leading-relaxed">
            Zarządzaj portfelem w realnych, historycznych kryzysach. Sprawdź, czy pokonasz inflację i ocalisz kapitał!
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-white/10 px-2.5 py-1.5 rounded-lg w-fit">
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
            className="object-contain drop-shadow-lg"
          />
        </div>
      </div>

      {/* Scenarios Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-base text-blue-950">Wybierz Scenariusz Historyczny</h3>
          <span className="text-xs text-grey-600 font-medium">{events.length} scenariusze</span>
        </div>
        <p className="text-xs text-grey-600 mb-3">
          Wszystkie dane (S&P 500, obligacje USA, złoto, CPI) bazują na zweryfikowanych źródłach rynkowych (Yahoo Finance, FRED, LBMA).
        </p>
      </div>

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {events.map((ev) => {
          const icon = EVENT_ICONS[ev.id] || '📈';
          const tag = EVENT_TAGS[ev.id] || { label: 'Scenariusz', color: 'bg-blue-100 text-blue-800' };

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl p-4 border border-blue-100 hover:border-blue-500 hover:shadow-md transition-all flex flex-col gap-3 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
                    {icon}
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-0.5 ${tag.color}`}>
                      {tag.label}
                    </span>
                    <h4 className="font-bold text-sm text-blue-950 leading-snug">{ev.title}</h4>
                  </div>
                </div>
              </div>

              <p className="text-xs text-grey-600 line-clamp-3">
                {ev.initial_context?.description || 'Historyczna symulacja rynkowa.'}
              </p>

              <div className="flex items-center justify-between text-xs text-grey-600 pt-2 border-t border-grey-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    📅 {ev.period}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-blue-950">
                    ⏱️ {ev.total_quarters} kwartałów
                  </span>
                </div>
                <button
                  onClick={() => onSelectEvent(ev)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
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
