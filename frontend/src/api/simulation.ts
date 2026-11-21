import {
  AssetAllocations,
  SimulationEventsResponse,
  SimulationEventDetailResponse,
  SimulationSession,
  StepQuarterResponse,
} from './types/simulation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function getSimulationEvents(): Promise<SimulationEventsResponse> {
  const res = await fetch(`${API_BASE}/api/simulation/events`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load simulation events: ${res.status}`);
  }
  return res.json();
}

export async function getSimulationEvent(eventId: string): Promise<SimulationEventDetailResponse> {
  const res = await fetch(`${API_BASE}/api/simulation/events/${eventId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load simulation event details: ${res.status}`);
  }
  return res.json();
}

export async function startSimulation(
  eventId: string,
  initialCapital?: number,
  allocations?: AssetAllocations
): Promise<{ status: string; session: SimulationSession; message: string }> {
  const res = await fetch(`${API_BASE}/api/simulation/events/${eventId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      initial_capital: initialCapital,
      allocations,
    }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to start simulation: ${res.status}`);
  }
  return res.json();
}

export async function submitInitialInvestment(
  eventId: string,
  allocations: AssetAllocations
): Promise<{ status: string; session: SimulationSession }> {
  const res = await fetch(`${API_BASE}/api/simulation/events/${eventId}/invest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ allocations }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to invest: ${res.status}`);
  }
  return res.json();
}

export async function stepSimulationQuarter(
  eventId: string,
  newAllocations?: AssetAllocations
): Promise<StepQuarterResponse> {
  const res = await fetch(`${API_BASE}/api/simulation/events/${eventId}/step-quarter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ new_allocations: newAllocations }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to step quarter: ${res.status}`);
  }
  return res.json();
}

export async function resetSimulation(eventId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/simulation/events/${eventId}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to reset simulation: ${res.status}`);
  }
  return res.json();
}
