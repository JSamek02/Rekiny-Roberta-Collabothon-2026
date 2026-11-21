'use client';

import { useCurrentUserQuery } from '@/api/services/auth-service';
import { ViewerType } from '@/api/types/auth';

/**
 * Current viewer of the app. Everyone is a `guest` (niezalogowany) until they sign in;
 * a signed-in user's type comes from their account role.
 * If the backend is unreachable the viewer is treated as a guest so the app stays usable.
 */
export const useViewer = () => {
  const { data: user, isPending } = useCurrentUserQuery({});

  const viewerType: ViewerType = user?.role ?? 'guest';
  const status = isPending ? 'loading' : user ? 'authenticated' : 'guest';

  return { status, user: user ?? null, viewerType } as const;
};
