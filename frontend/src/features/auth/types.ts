export type AuthProvider = "google" | "apple";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

/** Every failure the sign-in screens know how to show. */
export type AuthErrorCode =
  | "wrong-password"
  | "no-account"
  | "email-taken"
  | "network"
  | "not-connected"
  | "unknown";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthChangeListener = (user: AuthUser | null) => void;
