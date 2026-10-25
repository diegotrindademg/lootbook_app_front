/**
 * The one place every request to the Lootbook back end goes through, so the sign-in token is
 * added in one spot. Requests stay on the Next origin (`/api/lootbook/*`, see next.config.ts).
 */
const API_BASE_URL = "/api/lootbook";

type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider = async () => null;

/** Registered by the auth feature; returns the signed-in user's access token, or null. */
export function setAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;
}

export class LootbookApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "LootbookApiError";
  }

  /** True when the request never reached the back end. */
  get isNetworkError() {
    return this.status === 0;
  }
}

export async function lootbookRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // With no token the request goes without one: a development back end then uses its guest user.
  const token = await accessTokenProvider();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (error) {
    throw new LootbookApiError("Could not reach the Lootbook back end.", 0, error);
  }

  if (response.status === 204) return undefined as T;

  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new LootbookApiError(
      `The Lootbook back end answered ${response.status}.`,
      response.status,
      responseBody,
    );
  }

  return responseBody as T;
}
