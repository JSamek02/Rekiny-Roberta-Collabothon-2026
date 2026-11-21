'use client';

import { QueryClientProvider as BaseQueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { getQueryClient } from './query-client';

const queryClient = getQueryClient();

type QueryClientProviderProps = {
  children?: React.ReactNode;
};

export const QueryClientProvider = ({ children }: QueryClientProviderProps): React.ReactNode => {
  return <BaseQueryClientProvider client={queryClient}>{children}</BaseQueryClientProvider>;
};
