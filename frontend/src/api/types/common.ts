import { PhantomField } from '@/types/common';
import { AnySearchParams } from '@/types/next';

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers?: Headers;
  error?: string;
};

export type ApiRequest<
  QueryParams extends AnySearchParams = never,
  RequestParams = never,
  RequestHeaders = never,
  RequestBody = never,
> = PhantomField<QueryParams, 'queryParams'> &
  PhantomField<RequestParams, 'params'> &
  PhantomField<RequestHeaders, 'headers'> &
  PhantomField<RequestBody, 'body'>;

