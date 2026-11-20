import { ApiResponse } from '@/api/types/common';

export type ApiErrorResponse = {
  status: number;
  title: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
    public data?: ApiErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): ApiResponse<null> => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404: {
        return { data: null, status: 404 };
      }
      default: {
        return { data: null, status: error.status, error: error.message };
      }
    }
  }
  return { data: null, status: 500 };
};

export const omitRequestError = async <T>(request: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T | null>> => {
  try {
    return await request();
  } catch (e) {
    return handleApiError(e);
  }
};
