import { AnySearchParams } from '@/types/next';

/**
 * Parse AnySearchParams to URLSearchParams.\
 * This function removes params with undefined value and parses string[] values to string.
 */
export const parseToURLSearchParams = (searchParams?: AnySearchParams): URLSearchParams => {
  const newParams = new URLSearchParams();

  if (!searchParams) return newParams;

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      return value.forEach((v) => newParams.append(key, v));
    }
    return newParams.append(key, value);
  });

  return newParams;
};
