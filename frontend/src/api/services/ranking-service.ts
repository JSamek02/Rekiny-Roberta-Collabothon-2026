import { getApiClient } from '@/api/api-client';
import { ApiResponse } from '@/api/types/common';
import { ApiGetRanking } from '@/api/types/ranking';
import { UseReactQuery } from '@/api/types/react-query';
import { useQuery } from '@tanstack/react-query';

export const RANKING_QUERY_KEYS = {
  ranking: (limit?: number) => ['ranking', String(limit ?? 'default')],
};

export async function apiGetRanking({ limit }: ApiGetRanking.Params): Promise<ApiResponse<ApiGetRanking.Response>> {
  const client = await getApiClient();
  const query = limit ? `?limit=${limit}` : '';
  // The ranking is public; the session cookie only adds the signed-in user's own position.
  return client.get<ApiGetRanking.Response>(`/api/ranking${query}`, { credentials: 'include', cache: 'no-store' });
}

export const useApiGetRankingQuery: UseReactQuery<ApiGetRanking.Response, ApiGetRanking.Params> = (
  { limit },
  options,
) => {
  return useQuery({
    queryKey: RANKING_QUERY_KEYS.ranking(limit),
    queryFn: async () => {
      const result = await apiGetRanking({ limit });
      return result.data;
    },
    // XP changes after every completed activity, so keep the list fresh.
    staleTime: 30 * 1000,
    ...options,
  });
};
