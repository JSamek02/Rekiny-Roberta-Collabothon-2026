'use client';

import React, { useEffect, useState } from 'react';
import {
  AssetAllocations,
  SimulationEventSummary,
  SimulationSession,
} from './types';
import {
  getSimulationEvents,
  getSimulationEvent,
  startSimulation,
  submitInitialInvestment,
  stepSimulationQuarter,
  resetSimulation,
} from '@/api/simulation';
import { EventSelector, SHORT_EVENT_TITLES } from './EventSelector';
import { AllocationSliders } from './AllocationSliders';
import { QuarterHistoryChart } from './QuarterHistoryChart';
import { QuarterNewsCard } from './QuarterNewsCard';
import { EventDebriefModal } from './EventDebriefModal';
import { useSharkCoins, clearSessionCredited } from '@/hooks/use-shark-coins';
import {
  RotateCcw,
  Scale,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export const StockMarketView: React.FC = () => {
  const t = useTranslations('components.stock.view');
  const tEvents = useTranslations('components.stock.event-selector');
  const { handleInvestmentProfit } = useSharkCoins();

  const [events, setEvents] = useState<SimulationEventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SimulationEventSummary | null>(null);
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [allocations, setAllocations] = useState<AssetAllocations>({
    stocks: 0.4,
    bonds: 0.3,
    gold: 0.2,
    cash: 0.1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStepping, setIsStepping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRebalance, setShowRebalance] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Load available events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSimulationEvents();
      setEvents(data.events || []);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(t('error-connection'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = async (ev: SimulationEventSummary) => {
    setSelectedEvent(ev);
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getSimulationEvent(ev.id);
      if (detail.active_session) {
        setSession(detail.active_session);
        setAllocations(detail.active_session.allocations);
      } else {
        // Start fresh session
        const startRes = await startSimulation(ev.id, ev.starting_capital);
        setSession(startRes.session);
      }
    } catch (err: any) {
      console.error('Error starting event session:', err);
      setError(err.message || t('error-init'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmInitialInvestment = async () => {
    if (!selectedEvent || !session) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await submitInitialInvestment(selectedEvent.id, allocations);
      setSession(res.session);
    } catch (err: any) {
      console.error('Error setting investment:', err);
      setError(err.message || t('error-allocation'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepQuarter = async () => {
    if (!selectedEvent || !session) return;
    setIsStepping(true);
    setError(null);
    try {
      const newAlloc = showRebalance ? allocations : undefined;
      const res = await stepSimulationQuarter(selectedEvent.id, newAlloc);
      setSession(res.full_session);
      setAllocations(res.full_session.allocations);
      setShowRebalance(false);

      if (res.full_session.status === 'completed' && res.full_session.debrief) {
        const coinsAwarded = res.full_session.debrief.sharcoins_awarded ?? 0;
        if (coinsAwarded > 0) {
          handleInvestmentProfit(coinsAwarded, res.full_session);
        }
      }
    } catch (err: any) {
      console.error('Error advancing quarter:', err);
      setError(err.message || t('error-advance'));
    } finally {
      setIsStepping(false);
    }
  };

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    if (!selectedEvent) return;
    clearSessionCredited(selectedEvent.id);
    setShowResetConfirm(false);
    setIsLoading(true);
    setError(null);
    try {
      await resetSimulation(selectedEvent.id);
      const startRes = await startSimulation(selectedEvent.id, selectedEvent.starting_capital);
      setSession(startRes.session);
      setAllocations({ stocks: 0.4, bonds: 0.3, gold: 0.2, cash: 0.1 });
      setShowRebalance(false);
    } catch (err: any) {
      console.error('Error resetting session:', err);
      setError(err.message || t('error-reset'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSession(null);
    setError(null);
  };

  // Render Loading spinner
  if (isLoading && !selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs font-semibold text-blue-950">{t('loading')}</p>
      </div>
    );
  }

  // View: Event selection
  if (!selectedEvent || !session) {
    return (
      <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800">
            {error}
          </div>
        )}
        <EventSelector events={events} onSelectEvent={handleSelectEvent} isLoading={isLoading} />
      </div>
    );
  }

  // View: Awaiting initial investment
  const selectedEventTitle = selectedEvent
    ? (tEvents.has(`short-titles.${selectedEvent.id}` as any)
        ? tEvents(`short-titles.${selectedEvent.id}` as any)
        : null) ||
      SHORT_EVENT_TITLES[selectedEvent.id] ||
      selectedEvent.title
    : '';

  if (session.status === 'awaiting_initial_investment') {
    return (
      <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToEvents}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('back-to-events')}</span>
          </button>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
            {t('step-1-title')}
          </span>
        </div>

        {/* Intro banner */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
          <h2 className="text-base font-bold text-blue-950">
            {selectedEventTitle}
          </h2>
          <div className="flex items-center gap-2 text-xs font-semibold text-grey-600">
            <span>{selectedEvent.period}</span>
            <span>•</span>
            <span>{t('quarters-count', { count: selectedEvent.total_quarters })}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-grey-700 mt-1 leading-relaxed">
            {(tEvents.has(`descriptions.${selectedEvent.id}` as any)
              ? tEvents(`descriptions.${selectedEvent.id}` as any)
              : null) || selectedEvent.initial_context?.description}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-grey-100 mt-1">
            <span className="text-xs text-grey-600">{t('starting-budget')}</span>
            <span className="text-sm font-bold text-[#10b981] font-mono">
              {session.initial_capital.toLocaleString(undefined)} zł
            </span>
          </div>
        </div>

        {/* Sliders */}
        <AllocationSliders
          allocations={allocations}
          onChange={setAllocations}
          isInitial={true}
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleConfirmInitialInvestment}
          disabled={
            isLoading ||
            Math.round((allocations.stocks + allocations.bonds + allocations.gold + allocations.cash) * 100) !== 100
          }
          className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('starting')}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>{t('submit-portfolio')}</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </div>
    );
  }

  // View: Completed (Debrief)
  if (session.status === 'completed' && session.debrief) {
    return (
      <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        <EventDebriefModal
          debrief={session.debrief}
          eventTitle={selectedEventTitle}
          eventId={selectedEvent.id}
          onRestart={handleResetConfirm}
          onChooseOther={handleBackToEvents}
        />
        <QuarterHistoryChart history={session.history} />
      </div>
    );
  }

  // View: Active simulation in progress
  const currentIdx = session.current_quarter_index;
  const progressPct = Math.round((currentIdx / session.total_quarters) * 100);
  const latestHistory = session.history[session.history.length - 1];

  const nominalReturnPct = Math.round(
    ((session.current_capital - session.initial_capital) / session.initial_capital) * 10000
  ) / 100;
  const realCapital = Math.round((session.current_capital / session.cumulative_inflation_factor) * 100) / 100;
  const isNominalProfit = nominalReturnPct >= 0;

  return (
    <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full">
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToEvents}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('back-to-events-short')}</span>
        </button>
        <button
          onClick={handleResetRequest}
          disabled={isStepping}
          className="text-[11px] font-medium text-grey-600 hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>{t('reset')}</span>
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Progress across the crisis */}
      <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-blue-950 truncate max-w-[200px]">
            {selectedEventTitle}
          </span>
          <span className="font-semibold text-blue-600">
            {t('quarter-progress', { current: currentIdx, total: session.total_quarters })}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-grey-200 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Current Portfolio Card */}
      <div className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-grey-600 uppercase tracking-wide">
              {t('portfolio-value')}
            </span>
            <div className="text-2xl font-bold text-blue-950 font-mono">
              {session.current_capital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 ${
              isNominalProfit ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <span>{isNominalProfit ? '▲ +' : '▼ '}</span>
            <span>{nominalReturnPct.toFixed(2)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-grey-100 text-xs">
          <div>
            <span className="text-[10px] text-grey-600 block">{t('real-value')}</span>
            <span className="font-bold text-blue-950 font-mono">
              {realCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })} zł
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-grey-600 block">{t('max-drawdown')}</span>
            <span className="font-bold text-[#ef4444] font-mono">
              {session.max_drawdown_pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Latest Quarter News & Context Flash */}
      {latestHistory && latestHistory.quarter !== 'Start' && (
        <QuarterNewsCard quarterData={latestHistory} />
      )}

      {/* Interactive History Chart */}
      {session.history.length > 1 && (
        <QuarterHistoryChart history={session.history} />
      )}

      {/* Rebalance Section (Toggleable or always previewed) */}
      {showRebalance ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">{t('change-weights-title')}</span>
            <button
              onClick={() => setShowRebalance(false)}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>
          <AllocationSliders
            allocations={allocations}
            onChange={setAllocations}
            isInitial={false}
            disabled={isStepping}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3 border border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <span className="font-bold text-blue-950 block">{t('next-quarter-allocation')}</span>
              <span className="text-[10px] text-grey-600">
                {t('allocation-summary', {
                  stocks: Math.round(allocations.stocks * 100),
                  bonds: Math.round(allocations.bonds * 100),
                  gold: Math.round(allocations.gold * 100),
                  cash: Math.round(allocations.cash * 100),
                })}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowRebalance(true)}
            className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-semibold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
          >
            {t('change')}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Main Advance Quarter Action Button */}
      <button
        onClick={handleStepQuarter}
        disabled={isStepping}
        className="w-full py-3.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
      >
        {isStepping ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('calculating-returns')}</span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <span>{t('advance-quarter')}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </button>

      {/* In-app Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm"
            onClick={handleResetCancel}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-blue-100">
            {/* Icon + Title */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-base font-bold text-blue-950">{t('reset-modal-title')}</h3>
              <p className="text-xs text-grey-600 leading-relaxed">
                {t('reset-modal-desc')}
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResetCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-50 border border-blue-100 text-sm font-semibold text-blue-950 hover:bg-blue-100 transition-colors cursor-pointer text-center"
              >
                {t('reset-modal-cancel')}
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white text-sm font-bold shadow-md hover:bg-blue-600 active:scale-98 transition-all cursor-pointer text-center"
              >
                {t('reset-modal-confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
