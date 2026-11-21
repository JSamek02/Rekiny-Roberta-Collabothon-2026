import { getApiClient } from '@/api/api-client';
import {
  AssetAllocations,
  SimulationEventsResponse,
  SimulationEventDetailResponse,
  SimulationSession,
  StepQuarterResponse,
} from './types/simulation';

export async function getSimulationEvents(): Promise<SimulationEventsResponse> {
  const client = await getApiClient();
  const response = await client.get<SimulationEventsResponse>('/api/simulation/events');
  return response.data;
}

export async function getSimulationEvent(eventId: string): Promise<SimulationEventDetailResponse> {
  const client = await getApiClient();
  const response = await client.get<SimulationEventDetailResponse>(
    `/api/simulation/events/${eventId}`,
  );
  return response.data;
}

export async function startSimulation(
  eventId: string,
  initialCapital?: number,
  allocations?: AssetAllocations
): Promise<{ status: string; session: SimulationSession; message: string }> {
  const client = await getApiClient();
  const response = await client.post<
    { status: string; session: SimulationSession; message: string },
    { initial_capital?: number; allocations?: AssetAllocations }
  >(`/api/simulation/events/${eventId}/start`, {
    initial_capital: initialCapital,
    allocations,
  });
  return response.data;
}

export async function submitInitialInvestment(
  eventId: string,
  allocations: AssetAllocations
): Promise<{ status: string; session: SimulationSession }> {
  const client = await getApiClient();
  const response = await client.post<
    { status: string; session: SimulationSession },
    { allocations: AssetAllocations }
  >(`/api/simulation/events/${eventId}/invest`, { allocations });
  return response.data;
}

export async function stepSimulationQuarter(
  eventId: string,
  newAllocations?: AssetAllocations
): Promise<StepQuarterResponse> {
  const client = await getApiClient();
  const response = await client.post<
    StepQuarterResponse,
    { new_allocations?: AssetAllocations }
  >(`/api/simulation/events/${eventId}/step-quarter`, {
    new_allocations: newAllocations,
  });
  return response.data;
}

export async function resetSimulation(eventId: string): Promise<{ status: string; message: string }> {
  const client = await getApiClient();
  const response = await client.post<{ status: string; message: string }>(
    `/api/simulation/events/${eventId}/reset`,
  );
  return response.data;
}
