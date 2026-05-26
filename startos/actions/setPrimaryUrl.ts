import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getNonLocalUrls } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await getNonLocalUrls(effects)

    return {
      name: i18n('URL'),
      values: urls.reduce(
        (obj, url) => ({ ...obj, [url]: url }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setPrimaryUrl = sdk.Action.withInput(
  'set-primary-url',

  async ({ effects }) => ({
    name: i18n('Set Primary URL'),
    description: i18n(
      'Choose which of your Cal.diy URLs should serve as the primary URL. Cal.diy uses this for booking-page links, share URLs, magic-link login, and outbound email content. Setting it triggers a restart so the upstream replace-placeholder.sh can rewrite the statically-baked URL inside the container.',
    ),
    warning: i18n(
      "Safe to change at any time, but changing it after Cal.diy has been in use has real-world consequences: any OAuth integrations you have connected (Google, Microsoft, Zoom, etc.) will need their redirect URI re-registered with each provider and reconnected here, since the callback host they were registered with no longer matches; all active sessions will be signed out because NextAuth cookies are tied to the URL's domain; any booking links, embed snippets, or email signatures you have shared externally with the old URL stop working and need to be updated; and links inside already-sent booking confirmation emails will continue to point at the old URL (only new emails use the new URL).",
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    url: (await storeJson.read((s) => s.url).once()) || undefined,
  }),

  async ({ effects, input }) => storeJson.merge(effects, { url: input.url }),
)
