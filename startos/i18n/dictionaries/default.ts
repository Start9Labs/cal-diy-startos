export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Cal.diy!': 0,
  Database: 1,
  'Waiting for PostgreSQL to be ready': 2,
  'PostgreSQL is ready': 3,
  'Web Interface': 4,
  'Cal.diy is ready': 5,
  'Cal.diy is not ready': 6,

  // interfaces.ts
  'Web UI': 7,
  'The Cal.diy web interface for managing your calendar and bookings': 8,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
