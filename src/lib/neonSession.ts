export interface AuthenticatedCredentials {
  userId: string;
  token: string;
}

type AuthSession = {
  user?: { id?: string } | null;
  access_token?: unknown;
  token?: unknown;
};

type AuthResponse = {
  data?: {
    user?: { id?: string } | null;
    session?: AuthSession | null;
  } | null;
  user?: { id?: string } | null;
  session?: AuthSession | null;
  error?: unknown;
};

/**
 * A localStorage marker is never proof of authentication. When anonymous
 * Data API access is enabled, a token alone is not proof either.
 *
 * Managed Neon Auth exposes the Data API JWT on getSession().data.session
 * as access_token. Only accept that documented JWT alongside a real user.
 */
export function resolveAuthenticatedCredentials(
  sessionResult: AuthResponse | null | undefined
): AuthenticatedCredentials | null {
  if (!sessionResult || sessionResult.error) return null;

  const session = sessionResult.data?.session ?? sessionResult.session ?? null;
  const user =
    sessionResult.data?.user ??
    session?.user ??
    sessionResult.user ??
    null;
  const token = session?.access_token ?? session?.token;

  if (!user?.id || typeof token !== 'string' || token.trim().length === 0) return null;

  return { userId: String(user.id), token: token.trim() };
}
