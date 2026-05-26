export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Cal.diy!': 0,
  'store.json not found': 1,
  Database: 2,
  'Waiting for PostgreSQL to be ready': 3,
  'PostgreSQL is ready': 4,
  'Web Interface': 5,
  'Cal.diy is ready': 6,
  'Cal.diy is not ready': 7,
  'Primary URL': 8,
  'Booking links, email confirmations, and magic-link logins all point at ${url}. Use the "Set Primary URL" action to change this.': 9,
  'Email Delivery': 10,
  'SMTP configured — Cal.diy can send email.': 11,
  'SMTP not configured. Booking confirmations and magic-link sign-in will not send email until you run the "Configure SMTP" action.': 12,

  // interfaces.ts
  'Web UI': 13,
  'The Cal.diy web interface for managing your calendar and bookings': 14,

  // actions/setPrimaryUrl.ts
  URL: 15,
  'Set Primary URL': 16,
  'Choose which of your Cal.diy URLs should serve as the primary URL. Cal.diy uses this for booking-page links, share URLs, magic-link login, and outbound email content. Setting it triggers a restart so the upstream replace-placeholder.sh can rewrite the statically-baked URL inside the container.': 17,
  "Safe to change at any time, but changing it after Cal.diy has been in use has real-world consequences: any OAuth integrations you have connected (Google, Microsoft, Zoom, etc.) will need their redirect URI re-registered with each provider and reconnected here, since the callback host they were registered with no longer matches; all active sessions will be signed out because NextAuth cookies are tied to the URL's domain; any booking links, embed snippets, or email signatures you have shared externally with the old URL stop working and need to be updated; and links inside already-sent booking confirmation emails will continue to point at the old URL (only new emails use the new URL).": 38,

  // actions/manageSmtp.ts
  'Configure SMTP': 18,
  'Configure outbound email so Cal.diy can send booking confirmations, reminders, and magic-link sign-in messages.': 19,

  // init/taskSetPrimaryUrl.ts
  'Primary URL is no longer available. Select a new one.': 20,

  // actions/resetPassword.ts
  Email: 21,
  'The email address of the Cal.diy user whose password to reset.': 22,
  'Reset User Password': 23,
  'Generate a new random password for the Cal.diy user with the given email and store it directly in the database. Useful if a user has lost their password and SMTP-based recovery is unavailable.': 24,
  'Use only for accounts that authenticate via password. Users who sign in exclusively via OAuth (Google, Microsoft, etc.) do not have a stored password and resetting it here will have no effect.': 25,
  'Password hashing failed': 26,
  'Database password not found in store.json': 27,
  'No Cal.diy user found with email ${email}': 28,
  'Password Reset': 29,
  'The password for ${email} has been reset. Use the new password below to log in.': 30,
  'New Password': 31,

  // actions/toggleSignup.ts
  'Enable Signups': 32,
  'Disable Signups': 33,
  'Signups are currently disabled. Run this action to allow new account creation on your Cal.diy instance.': 34,
  'Signups are currently enabled. Run this action to prevent new account creation. Existing users are unaffected; only new signups are blocked.': 35,
  'Anyone who can reach this Cal.diy instance will be able to create an account. Only re-enable if you intend to invite new users.': 36,
  'A vestigial "Create Account" link will still render in the login page footer (it is baked into the static JavaScript bundle at upstream build time), but clicking it redirects to a "Signup is disabled" error page. Server-side enforcement is in effect.': 37,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
