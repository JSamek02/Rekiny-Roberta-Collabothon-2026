'use client';

import React from 'react';
import Image from 'next/image';
import { SimulationDebrief } from './types';

interface EventDebriefModalProps {
  debrief: SimulationDebrief;
  eventTitle: string;
  onRestart: () => void;
  onChooseOther: () => void;
}

const BADGE_CONFIG: Record<string, { icon: string; desc: string }> = {
  'Tarcza Bezpieczeństwa': { icon: '🛡️', desc: 'Maksymalne obsunięcie portfela poniżej 15%' },
  'Pogromca Inflacji': { icon: '🦅', desc: 'Realny zysk przewyższający inflację CPI' },
  'Diamentowe Płetwy': { icon: '💎', desc: 'Żelazna dyscyplina i brak panicznej sprzedaży' },
};

export const EventDebriefModal: React.FC<EventDebriefModalProps> = ({
  debrief,
  eventTitle,
  onRestart,
  onChooseOther,
}) => {
  const isProfit = debrief.nominal_return_pct >= 0;
  const isRealProfit = debrief.real_return_pct >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xl flex flex-col gap-4 animate-fadeIn">
      {/* Trophy & Header */}
      <div className="text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-3xl shadow-md mb-2">
          🏆
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Kryzys Zakończony</span>
        <h2 className="text-lg font-bold text-blue-950 mt-0.5">{eventTitle}</h2>
      </div>

      {/* Rewards Banner */}
      <div className="flex items-center justify-center gap-6 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
        <div className="flex items-center gap-1.5">
          <Image src="/img/green-gem.svg" alt="" width={22} height={22} />
          <span className="text-xs font-bold text-emerald-800">+{debrief.xp_awarded || 300} XP</span>
        </div>
        <div className="h-4 w-px bg-blue-200" />
        <div className="flex items-center gap-1.5">
          <Image src="/img/coin.svg" alt="" width={22} height={22} />
          <span className="text-xs font-bold text-amber-800">+{debrief.sharcoins_awarded || 150} SharkCoins</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-grey-50 border border-grey-100">
          <span className="text-grey-600 block text-[11px]">Kapitał Końcowy</span>
          <span className="text-base font-bold text-blue-950">
            {debrief.final_capital.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
          </span>
          <span
            className={`text-[11px] font-bold block mt-0.5 ${
              isProfit ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isProfit ? '+' : ''}
            {debrief.nominal_return_pct}% zwrot nominalny
          </span>
        </div>

        <div className="p-3 rounded-xl bg-grey-50 border border-grey-100">
          <span className="text-grey-600 block text-[11px]">Wartość Realna (po inflacji)</span>
          <span className="text-base font-bold text-blue-950">
            {debrief.real_capital.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
          </span>
          <span
            className={`text-[11px] font-bold block mt-0.5 ${
              isRealProfit ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isRealProfit ? '+' : ''}
            {debrief.real_return_pct}% realny zysk
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-grey-50 border border-grey-100 col-span-2 flex items-center justify-between text-xs">
          <div>
            <span className="text-grey-600 text-[11px] block">Maksymalny spadek (Drawdown):</span>
            <span className="font-bold text-red-600 font-mono text-sm">{debrief.max_drawdown_pct}%</span>
          </div>
          <div className="text-right">
            <span className="text-grey-600 text-[11px] block">Liczba rebalancingów:</span>
            <span className="font-bold text-blue-950 font-mono text-sm">{debrief.rebalances_count}</span>
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      {debrief.badges_earned && debrief.badges_earned.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-blue-950 mb-2">Zdobyte Odznaki Inwestycyjne:</h4>
          <div className="flex flex-col gap-1.5">
            {debrief.badges_earned.map((badgeName) => {
              const b = BADGE_CONFIG[badgeName] || { icon: '🎖️', desc: 'Sukces w zarządzaniu kapitałem' };
              return (
                <div
                  key={badgeName}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs"
                >
                  <span className="text-xl shrink-0">{b.icon}</span>
                  <div>
                    <span className="font-bold text-amber-950 block">{badgeName}</span>
                    <span className="text-[10px] text-amber-800">{b.desc}</span>
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
              src="/img/shark.png"
              alt="Robert Biznesu"
              width={48}
              height={56}
              className="object-contain drop-shadow"
            />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wide block">
              Werdykt Roberta Biznesu:
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed mt-0.5">
              &ldquo;{debrief.robert_verdict.message}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Educational Takeaways */}
      {debrief.educational_takeaways && debrief.educational_takeaways.length > 0 && (
        <div className="bg-grey-50 p-3 rounded-xl border border-grey-100">
          <h4 className="text-xs font-bold text-blue-950 mb-1.5">Wnioski na Przyszłość:</h4>
          <ul className="flex flex-col gap-1.5 text-xs text-grey-700">
            {debrief.educational_takeaways.map((point, idx) => (
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
          className="flex-1 py-2.5 px-3 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-all active:scale-95"
        >
          🔄 Zagraj ponownie
        </button>
        <button
          onClick={onChooseOther}
          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          Lista scenariuszy ➔
        </button>
      </div>
    </div>
  );
};
