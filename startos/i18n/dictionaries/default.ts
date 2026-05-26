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

  // actions/manageSmtp.ts
  'Configure SMTP': 18,
  'Configure outbound email so Cal.diy can send booking confirmations, reminders, and magic-link sign-in messages.': 19,

  // init/taskSetPrimaryUrl.ts
  'Primary URL is no longer available. Select a new one.': 20,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
