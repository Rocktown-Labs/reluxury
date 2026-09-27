// Public Turnstile site key for the pre-created Cloudflare widget.
// Safe to ship to the browser — verification happens server-side.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFFQIKD3L4SwXmf-";

export const TURNSTILE_ACTIONS = {
  login: "login",
  signup: "signup",
} as const;

export type TurnstileAction =
  (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];
