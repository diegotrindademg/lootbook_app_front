import type { AuthProvider } from "../types";
import styles from "./AuthProviderButtons.module.css";

const PROVIDERS: { id: AuthProvider; label: string; paths: string[] }[] = [
  {
    id: "google",
    label: "Continue with Google",
    paths: [
      "M23.04 12.26c0-.85-.08-1.67-.22-2.46H12v4.65h6.19a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.43-4.96 3.43-8.56z",
      "M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.72-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.25 0-6-2.19-6.98-5.14H1.18v3.01A12 12 0 0 0 12 24z",
      "M5.02 14.16A7.2 7.2 0 0 1 4.64 12c0-.75.13-1.48.36-2.16V6.83H1.18A12 12 0 0 0 0 12c0 1.94.46 3.77 1.18 5.17l3.84-3.01z",
      "M12 4.75c1.77 0 3.35.61 4.6 1.8l3.3-3.3C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.18 6.83l3.84 3.01C6 6.94 8.75 4.75 12 4.75z",
    ],
  },
  {
    id: "apple",
    label: "Continue with Apple",
    paths: [
      "M17.05 12.54c.02-2.28 1.86-3.37 1.95-3.43-1.06-1.56-2.71-1.78-3.3-1.8-1.41-.15-2.75.83-3.46.83-.71 0-1.81-.81-2.98-.79-1.63.02-3.13.94-3.97 2.4-1.69 2.93-.43 7.28 1.21 9.66.75 1.09 1.66 2.29 2.85 2.25 1.14-.04 1.57-.74 2.96-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.11 2.76-2.21.87-1.27 1.23-2.51 1.25-2.57-.03-.01-2.37-.91-2.39-3.61z",
      "M14.94 4.5c.63-.76 1.05-1.82.94-2.87-.9.04-2 .6-2.65 1.36-.58.67-1.09 1.75-.95 2.78 1.01.08 2.03-.51 2.66-1.27z",
    ],
  },
];

type AuthProviderButtonsProps = {
  disabled: boolean;
  onSelect: (provider: AuthProvider) => void;
};

/** Providers first, email second: Google and Apple, then an "or" rule above the email form. */
export default function AuthProviderButtons({ disabled, onSelect }: AuthProviderButtonsProps) {
  return (
    <div className={styles.block}>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className={styles.provider}
          disabled={disabled}
          onClick={() => onSelect(provider.id)}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {provider.paths.map((d) => (
              <path key={d} d={d} fill="currentColor" />
            ))}
          </svg>
          {provider.label}
        </button>
      ))}
      <div className={styles.divider}>
        <span className={styles.rule} />
        <span className={styles.or}>or</span>
        <span className={styles.rule} />
      </div>
    </div>
  );
}
