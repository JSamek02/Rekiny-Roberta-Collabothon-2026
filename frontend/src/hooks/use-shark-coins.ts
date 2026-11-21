'use client';

import { AUTH_QUERY_KEYS, apiPostGameCoin } from '@/api/services/auth-service';
import { SimulationSession } from '@/api/services/simulation-service';
import { syncSimulationSessions } from '@/api/simulation';
import { AuthUser } from '@/api/types/auth';
import { useViewer } from '@/components/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

export const DEFAULT_STARTING_SHARK_COINS = 3000;
const COINS_STORAGE_KEY = 'shark-finance.shark-coins.v1';
const SESSIONS_STORAGE_KEY = 'shark-finance.simulation-sessions.v1';
const CREDITED_SESSIONS_KEY = 'shark-finance.credited-sessions.v1';
const UPDATE_EVENT = 'shark-finance.shark-coins.updated';

export const getGuestSharkCoins = (): number => {
  if (typeof window === 'undefined') {
    return DEFAULT_STARTING_SHARK_COINS;
  }
  try {
    const raw = window.localStorage.getItem(COINS_STORAGE_KEY);
    if (raw === null) {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(DEFAULT_STARTING_SHARK_COINS));
      return DEFAULT_STARTING_SHARK_COINS;
    }
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_STARTING_SHARK_COINS;
  } catch {
    return DEFAULT_STARTING_SHARK_COINS;
  }
};

export const saveGuestSharkCoins = (amount: number): number => {
  const safeAmount = Math.max(0, Math.round(amount));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COINS_STORAGE_KEY, String(safeAmount));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { sharkCoins: safeAmount } }));
    } catch {
      // Local storage unavailable
    }
  }
  return safeAmount;
};

/**
 * Dodaje zysk z inwestycji (jeśli zysk > 0). Jeśli strata lub 0, nic nie zmienia.
 */
export const addGuestProfitCoins = (profit: number): number => {
  const current = getGuestSharkCoins();
  if (profit > 0) {
    const newTotal = current + Math.round(profit);
    return saveGuestSharkCoins(newTotal);
  }
  return current;
};

export const getCreditedSessions = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CREDITED_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const isSessionCredited = (eventId: string): boolean => {
  const credited = getCreditedSessions();
  return Boolean(credited[eventId]);
};

export const markSessionCredited = (eventId: string, amount: number) => {
  if (typeof window === 'undefined') return;
  try {
    const credited = getCreditedSessions();
    credited[eventId] = amount;
    window.localStorage.setItem(CREDITED_SESSIONS_KEY, JSON.stringify(credited));
  } catch {}
};

export const clearSessionCredited = (eventId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const credited = getCreditedSessions();
    delete credited[eventId];
    window.localStorage.setItem(CREDITED_SESSIONS_KEY, JSON.stringify(credited));
  } catch {}
};

export const getGuestSimulationSessions = (): Record<string, SimulationSession> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveGuestSimulationSession = (session: SimulationSession) => {
  if (typeof window === 'undefined') return;
  try {
    const all = getGuestSimulationSessions();
    all[session.event_id] = session;
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Local storage unavailable
  }
};

export const clearGuestSimulationSessions = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
  } catch {}
};

const subscribeCoins = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(UPDATE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(UPDATE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

const getCoinsSnapshot = () => getGuestSharkCoins();
const getServerSnapshot = () => DEFAULT_STARTING_SHARK_COINS;

export const useSharkCoins = () => {
  const { user, status } = useViewer();
  const queryClient = useQueryClient();
  const localCoins = useSyncExternalStore(subscribeCoins, getCoinsSnapshot, getServerSnapshot);

  // Automatyczna synchronizacja sesji symulacji do bazy danych po zalogowaniu użytkownika
  useEffect(() => {
    if (!user) return;
    const pendingSessions = Object.values(getGuestSimulationSessions());
    if (pendingSessions.length > 0) {
      syncSimulationSessions(pendingSessions)
        .then(() => {
          clearGuestSimulationSessions();
          queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
        })
        .catch((err) => {
          console.warn('Could not sync guest simulation sessions:', err);
        });
    }
  }, [user, queryClient]);

  const isGuest = !user;
  const sharkCoins = user ? user.shark_coins : localCoins;
  const storageType: 'database' | 'local' = user ? 'database' : 'local';

  /**
   * Wywoływane po zakończeniu wyzwania inwestycyjnego na market stocku.
   * Jeśli użytkownik zarobił (profit > 0), kwota zysku dodaje się do konta:
   * - dla zalogowanego: odświeża zapytanie auth-me z bazy danych
   * - dla gościa: zapisuje powiększoną kwotę w localStorage
   * Jeśli strata (profit <= 0): nic się nie dzieje.
   */
  const handleInvestmentProfit = useCallback(
    (profit: number, completedSession?: SimulationSession) => {
      if (completedSession && isGuest) {
        saveGuestSimulationSession(completedSession);
      }

      if (profit <= 0) {
        return sharkCoins;
      }

      if (user) {
        // Po zalogowaniu dane zapisane są w DB przez backend; odświeżamy dane użytkownika
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
        return (user.shark_coins || 0) + Math.round(profit);
      } else {
        // Niezalogowany - zapisujemy lokalnie, zapobiegając podwójnemu naliczeniu
        if (completedSession?.event_id) {
          if (isSessionCredited(completedSession.event_id)) {
            return getGuestSharkCoins();
          }
          markSessionCredited(completedSession.event_id, profit);
        }
        return addGuestProfitCoins(profit);
      }
    },
    [user, isGuest, sharkCoins, queryClient]
  );

  const creditGameCoin = useCallback(
    (amount: number) => {
      if (!user) {
        addGuestProfitCoins(amount);
        return;
      }
      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEYS.currentUser, (current) =>
        current ? { ...current, shark_coins: (current.shark_coins || 0) + amount } : current,
      );
      apiPostGameCoin()
        .then(({ shark_coins }) =>
          queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEYS.currentUser, (current) =>
            current ? { ...current, shark_coins } : current,
          ),
        )
        .catch((err) => {
          console.warn('Could not credit game coin:', err);
          queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
        });
    },
    [user, queryClient],
  );

  return {
    sharkCoins,
    isGuest,
    storageType,
    isLoading: status === 'loading',
    handleInvestmentProfit,
    creditGameCoin,
    refreshCoins: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
      } else {
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
      }
    },
  };
};
