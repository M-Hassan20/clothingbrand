import { ApiError } from '../api/client';

/**
 * Extracts a descriptive human-readable error message from API calls or caught errors,
 * falling back to the provided default message if no specific message is available.
 */
export function getErrorMessage(err: unknown, fallbackMessage: string): string {
  if (err instanceof ApiError && err.message && err.message.trim()) {
    return err.message;
  }
  if (err instanceof Error && err.message && err.message.trim()) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  return fallbackMessage;
}
