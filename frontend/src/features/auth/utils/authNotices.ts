import { isOnline } from "@/shared/hooks/useOnline";
import { AuthError } from "../types";

export type AuthField = "email" | "password" | "confirm";

/** An error shown in place on a sign-in screen, and the field it points at. */
export type AuthNotice = {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  field?: AuthField;
};

/** Copy of the three drawn errors (05.6 to 05.8), with commas where the design has dashes. */
export const authNotices = {
  wrongPassword: (onReset: () => void): AuthNotice => ({
    title: "That password does not match",
    body: "Try again, or send yourself a reset link.",
    actionLabel: "Reset",
    onAction: onReset,
    field: "password",
  }),
  noAccount: (hasDraft: boolean, onCreate: () => void): AuthNotice => ({
    title: "No account for that email",
    body: hasDraft ? "Create one instead, your draft comes with you." : "Create one instead.",
    actionLabel: "Create",
    onAction: onCreate,
    field: "email",
  }),
  emailTaken: (hasDraft: boolean, onSignIn: () => void): AuthNotice => ({
    title: "That email already has an account",
    body: hasDraft ? "Sign in and this draft joins the characters already on it." : "Sign in instead.",
    actionLabel: "Sign in",
    onAction: onSignIn,
    field: "email",
  }),

  /** Figma 2372:2469: the reset link no longer works. */
  linkExpired: (): AuthNotice => ({
    title: "That link has expired",
    body: "Reset links only work for a while. Send yourself a new one.",
  }),

  // Not drawn in the design: the plainest version of each.
  missing: (field: AuthField): AuthNotice => ({ title: "Fill in every field", field }),
  invalidEmail: (): AuthNotice => ({ title: "Enter a valid email", field: "email" }),
  /** Set a new password uses Figma's wording (2372:2394), create account the plain one. */
  mismatch: (newPassword = false): AuthNotice => ({
    title: "The passwords do not match",
    body: newPassword
      ? "Type the same new password in both fields."
      : "Type the same password in both fields.",
    field: "confirm",
  }),
  failed: (error: unknown): AuthNotice => {
    if (error instanceof AuthError && error.code === "not-connected") {
      return { title: "Sign-in is not connected yet", body: "This build has no sign-in service behind it." };
    }
    // WAITING ON DESIGN: 8. Signing in offline (contract 3): say so plainly; the draft stays on the device.
    if (!isOnline()) {
      return { title: "You are offline", body: "Signing in needs a connection. Try again when you are back." };
    }
    return { title: "Could not reach the sign-in service", body: "Check your connection and try again." };
  },
};

export function isAuthError(error: unknown, code: AuthError["code"]) {
  return error instanceof AuthError && error.code === code;
}

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const REASSURANCE = "Your draft is kept either way";
