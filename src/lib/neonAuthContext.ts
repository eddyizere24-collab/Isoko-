export interface NeonAuthContextError {
  code?: string | number | null;
  message?: string | null;
}

/**
 * Neon can intermittently lose request.jwt.claims on a freshly initialized
 * Data API connection. Only the exact AUTH_REQUIRED SQLSTATE is eligible for
 * the bounded retry around the idempotent seller-registration draft upsert.
 * Ordinary permission errors and all other failures remain non-retryable.
 */
export function isRetryableNeonAuthContextError(error: NeonAuthContextError | null | undefined): boolean {
  return String(error?.code ?? '') === '28000' && String(error?.message ?? '') === 'AUTH_REQUIRED';
}
