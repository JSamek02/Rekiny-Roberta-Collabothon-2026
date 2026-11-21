import { getApiClient } from '@/api/api-client';
import { ApiError } from '@/api/error-handler';
import {
  ApiGetAuthConfig,
  ApiGetCurrentUser,
  ApiPostLogout,
  ApiPostMockLogin,
  AuthUser,
} from '@/api/types/auth';
import { UseReactQuery, UseReactQueryMutation } from '@/api/types/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type NoParams = Record<string, never>;

export const AUTH_QUERY_KEYS = {
  config: ['auth-config'],
  currentUser: ['auth-me'],
};

// The session lives in an HttpOnly cookie set by the backend, so every auth request must send it.
const WITH_SESSION: RequestInit = { credentials: 'include', cache: 'no-store' };
// Backend requires this header on state-changing auth requests (CSRF protection).
const AJAX_HEADERS = { 'X-Requested-With': 'XMLHttpRequest' };

/** Starts the Google OAuth flow. Must be a full-page navigation, not a fetch. */
export const getGoogleLoginUrl = () => `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/auth/google`;

export async function apiGetAuthConfig(): Promise<ApiGetAuthConfig.Response> {
  const client = await getApiClient();
  const res = await client.get<ApiGetAuthConfig.Response>('/api/auth/config', WITH_SESSION);
  return res.data;
}

export const useAuthConfigQuery: UseReactQuery<ApiGetAuthConfig.Response, NoParams> = (_, options) => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.config,
    queryFn: apiGetAuthConfig,
    ...options,
  });
};

/** Returns the signed-in user, or `null` for a guest (no valid session). */
export async function apiGetCurrentUser(): Promise<AuthUser | null> {
  const client = await getApiClient();
  try {
    const res = await client.get<ApiGetCurrentUser.Response>('/api/auth/me', WITH_SESSION);
    return res.data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const useCurrentUserQuery: UseReactQuery<AuthUser | null, NoParams> = (_, options) => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: apiGetCurrentUser,
    // A logout/login elsewhere must be reflected quickly, so don't keep the session cached long.
    staleTime: 30 * 1000,
    retry: false,
    ...options,
  });
};

export async function apiMockLogin({ body }: ApiPostMockLogin.Request): Promise<ApiPostMockLogin.Response> {
  const client = await getApiClient();
  const res = await client.post<ApiPostMockLogin.Response, ApiPostMockLogin.Body>('/api/auth/mock', body, {
    ...WITH_SESSION,
    headers: AJAX_HEADERS,
  });
  return res.data;
}

/** Demo login, available only when the backend runs with `--auth-mode mock`. */
export const useMockLoginMutation: UseReactQueryMutation<ApiPostMockLogin.Response, ApiPostMockLogin.Body> = (
  options,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth-mock-login'],
    mutationFn: (body: ApiPostMockLogin.Body) => apiMockLogin({ body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.currentUser }),
    ...options,
  });
};

export async function apiLogout(): Promise<ApiPostLogout.Response> {
  const client = await getApiClient();
  const res = await client.post<ApiPostLogout.Response>('/api/auth/logout', undefined, {
    ...WITH_SESSION,
    headers: AJAX_HEADERS,
  });
  return res.data;
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth-logout'],
    mutationFn: apiLogout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, null);
      // Data fetched with the old session (e.g. progress) may differ for a guest.
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== AUTH_QUERY_KEYS.currentUser[0] });
    },
  });
};
