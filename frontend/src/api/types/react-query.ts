import {
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';

export type UseQueryPartialOptions<T> = Partial<UndefinedInitialDataOptions<T, Error, T, string[]>>;
export type UseMutationPartialOptions<T = void> = Partial<UseMutationOptions<T, Error, unknown, unknown>>;

type QueryWithoutParams<TResponse> = (options?: UseQueryPartialOptions<TResponse>) => UseQueryResult<TResponse, Error>;
type QueryWithParams<TResponse, TRequest> = (
  params: TRequest,
  options?: UseQueryPartialOptions<TResponse>,
) => UseQueryResult<TResponse, Error>;

export type UseReactQuery<TResponse, TRequest = never> = TRequest extends never
  ? QueryWithoutParams<TResponse>
  : QueryWithParams<TResponse, TRequest>;

export type UseReactQueryMutation<TResponse, TRequestBody> = (
  options?: UseMutationPartialOptions<TResponse>,
) => UseMutationResult<TResponse, Error, TRequestBody>;
