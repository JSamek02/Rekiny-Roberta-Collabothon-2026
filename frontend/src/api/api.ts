import { ApiError, ApiErrorResponse } from '@/api/error-handler';
import { ApiResponse } from '@/api/types/common';

export type ApiConfig = {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  defaultOptions?: RequestInit;
};

/** Class extending native fetch logic. Throws ApiError on request error response */
export class ApiClient {
  private readonly config: Required<ApiConfig>;

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || Number.parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT),
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
      defaultOptions: {
        next: {
          revalidate: Number.parseInt(process.env.NEXT_PUBLIC_API_REVALIDATE),
          ...config.defaultOptions?.next,
        },
        ...config.defaultOptions,
      },
    };
  }

  /** Concat base url with given path */
  private buildUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const subpath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}${subpath}`;
  }

  /** Returns merged default config with given options */
  private buildRequestOptions(options: RequestInit): RequestInit {
    return {
      ...options,
      next: { ...this.config.defaultOptions.next, ...options.next },
      headers: { ...this.config.defaultHeaders, ...options.headers },
    };
  }

  /** Parses request response based on content type */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        throw new ApiError('[API] Invalid JSON response', response.status, response);
      }
    }

    return (await response.text()) as unknown as T;
  }

  /**
   * Core request logic.\
   * Timeouts request if it didn't respond in configured timeout time.\
   * Parses response based on content type.\
   * Throws ApiError
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      const response = await fetch(url, { ...requestOptions, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const parsedResponse = await this.parseResponse<ApiErrorResponse>(response);
        throw new ApiError(
          `[API] HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response,
          parsedResponse,
        );
      }

      const data = await this.parseResponse<T>(response);

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      if (error instanceof ApiError && error.name === 'AbortError') {
        throw new ApiError('[API] Request timeout', 408);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('[API] Unexpected error', 500);
    }
  }

  /**
   * Handles api GET request
   * @param endpoint Endpoint path after `baseUrl` from config.
   * @param options Native fetch options.
   */
  async get<Response>(endpoint: string, options?: RequestInit): Promise<ApiResponse<Response>> {
    return this.makeRequest<Response>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Handles api POST request
   * @param endpoint Endpoint path after `baseUrl` from config.
   * @param data Request body in object format.
   * @param options Native fetch options.
   */
  async post<Response, RequestBody = undefined>(
    endpoint: string,
    data?: RequestBody,
    options?: RequestInit,
  ): Promise<ApiResponse<Response>> {
    return this.makeRequest<Response>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
