export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message: string;
}

export interface ErrorEnvelope {
  success: false;
  message: string;
  errors?: unknown[];
}

export const DEFAULT_SUCCESS_MESSAGE = 'Success';

/** Builds the documented success envelope `{ success, data, message }`. */
export function ok<T>(
  data: T,
  message: string = DEFAULT_SUCCESS_MESSAGE,
): SuccessEnvelope<T> {
  return { success: true, data, message };
}

/** Builds the documented error envelope `{ success: false, message, errors? }`. */
export function fail(message: string, errors?: unknown[]): ErrorEnvelope {
  return errors
    ? { success: false, message, errors }
    : { success: false, message };
}
