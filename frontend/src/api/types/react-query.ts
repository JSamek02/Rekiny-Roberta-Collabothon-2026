import {
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';

export type UseQueryPartialOptions<T> = Partial<UndefinedInitialDataOptions<T, Error, T, QueryKey>>;
export type UseMutationPartialOptions<TResponse = void, TVariables = unknown> = Partial<
  UseMutationOptions<TResponse, Error, TVariables, unknown>
>;

type QueryWithoutParams<TResponse> = (options?: UseQueryPartialOptions<TResponse>) => UseQueryResult<TResponse, Error>;
type QueryWithParams<TResponse, TRequest> = (
  params: TRequest,
  options?: UseQueryPartialOptions<TResponse>,
) => UseQueryResult<TResponse, Error>;

export type UseReactQuery<TResponse, TRequest = never> = TRequest extends never
  ? QueryWithoutParams<TResponse>
  : QueryWithParams<TResponse, TRequest>;

export type UseReactQueryMutation<TResponse, TRequestBody> = (
  options?: UseMutationPartialOptions<TResponse, TRequestBody>,
) => UseMutationResult<TResponse, Error, TRequestBody>;
