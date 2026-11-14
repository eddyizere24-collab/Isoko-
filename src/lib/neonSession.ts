export interface AuthenticatedCredentials {
  userId: string;
  token: string;
}

type AuthResponse = {
  data?: {
    user?: { id?: string } | null;
    session?: { user?: { id?: string } | null } | null;
    token?: unknown;
  } | null;
  user?: { id?: string } | null;
  token?: unknown;
  error?: unknown;
};

/**
 * A localStorage marker is never proof of authentication. When anonymous
 * Data API access is enabled, a token alone is not proof either. Accept only
 * a non-empty user JWT paired with a real Better Auth user session.
 */
export function resolveAuthenticatedCredentials(
  sessionResult: AuthResponse | null | undefined,
  tokenResult: AuthResponse | null | undefined
): AuthenticatedCredentials | null {
  if (!sessionResult || !tokenResult || sessionResult.error || tokenResult.error) return null;

  const user =
    sessionResult.data?.user ??
    sessionResult.data?.session?.user ??
    sessionResult.user ??
    null;
  const token = tokenResult.data?.token ?? tokenResult.token;

  if (!user?.id || typeof token !== 'string' || token.trim().length === 0) return null;

  return { userId: String(user.id), token: token.trim() };
}
