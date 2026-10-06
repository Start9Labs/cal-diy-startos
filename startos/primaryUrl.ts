import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiHostId, uiInterfaceId } from './utils'

export const primaryUrl = sdk.setupPrimaryUrl({
  id: 'set-primary-url',
  hostId: uiHostId,
  interfaceId: uiInterfaceId,
  metadata: {
    name: i18n('Set Primary URL'),
    description: i18n(
      'Choose which of your Cal.diy URLs should serve as the primary URL. Cal.diy uses this for booking-page links, share URLs, magic-link login, and outbound email content. Changing it restarts Cal.diy.',
    ),
    warning: i18n(
      "Safe to change at any time, but changing it after Cal.diy has been in use has real-world consequences: any OAuth integrations you have connected (Google, Microsoft, Zoom, etc.) will need their redirect URI re-registered with each provider and reconnected here, since the callback host they were registered with no longer matches; all active sessions will be signed out because NextAuth cookies are tied to the URL's domain; any booking links, embed snippets, or email signatures you have shared externally with the old URL stop working and need to be updated; and links inside already-sent booking confirmation emails will continue to point at the old URL (only new emails use the new URL).",
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  field: { name: i18n('URL'), description: null },
  get: storeJson.read((s) => s.url),
  set: (effects, url) => storeJson.merge(effects, { url }),
})
