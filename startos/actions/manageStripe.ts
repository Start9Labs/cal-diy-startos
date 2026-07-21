import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { builtWebappUrl } from '../utils'

const { InputSpec, Value, Variants } = sdk

// cal.com validates the seeded app keys against a zod schema that requires the
// `ca_` / `sk_` / `pk_` / `whsec_` prefixes (packages/app-store/stripepayment/
// zod.ts). Mirror those prefixes here so a mis-pasted key is caught in the form
// rather than silently failing at boot when seed-app-store.ts runs.
//
// Top-level union: "Enabled" makes all four credentials required; "Disabled"
// carries no fields. This enforces all-or-nothing in the spec itself — cal's
// seed-app-store.ts only seeds the Stripe app when all four (plus the
// PAYMENT_FEE_* vars main.ts adds) are present.
export const inputSpec = InputSpec.of({
  stripe: Value.union({
    name: i18n('Stripe Payments'),
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: i18n('Disabled'), spec: InputSpec.of({}) },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          publishableKey: Value.text({
            name: i18n('Publishable key'),
            description: i18n(
              'Your Stripe publishable key, from Developers → API keys.',
            ),
            required: true,
            default: null,
            placeholder: 'pk_live_...',
            patterns: [
              {
                regex: '^pk_.+',
                description: 'Stripe publishable keys start with "pk_".',
              },
            ],
            masked: false,
          }),
          secretKey: Value.text({
            name: i18n('Secret key'),
            description: i18n(
              'Your Stripe secret key, from Developers → API keys. Stored securely and never displayed back.',
            ),
            required: true,
            default: null,
            placeholder: 'sk_live_...',
            patterns: [
              {
                regex: '^sk_.+',
                description: 'Stripe secret keys start with "sk_".',
              },
            ],
            masked: true,
          }),
          connectClientId: Value.text({
            name: i18n('Connect client ID'),
            description: i18n(
              'Your Stripe Connect OAuth client ID, from Connect → Settings → Integration.',
            ),
            required: true,
            default: null,
            placeholder: 'ca_...',
            patterns: [
              {
                regex: '^ca_.+',
                description: 'Stripe Connect client IDs start with "ca_".',
              },
            ],
            masked: false,
          }),
          webhookSecret: Value.text({
            name: i18n('Webhook signing secret'),
            description: i18n(
              'The signing secret of the webhook endpoint you add in Stripe, using the webhook URL in the description above.',
            ),
            required: true,
            default: null,
            placeholder: 'whsec_...',
            patterns: [
              {
                regex: '^whsec_.+',
                description:
                  'Stripe webhook signing secrets start with "whsec_".',
              },
            ],
            masked: true,
          }),
        }),
      },
    }),
  }),
})

export const manageStripe = sdk.Action.withInput(
  'manage-stripe',

  async ({ effects }) => {
    const url = (await storeJson.read((s) => s.url).once()) || builtWebappUrl
    const callbackUrl = `${url}/api/integrations/stripepayment/callback`
    const webhookUrl = `${url}/api/integrations/stripepayment/webhook`

    return {
      name: i18n('Configure Stripe Payments'),
      description: i18n(
        'Let calendar owners collect payment for paid bookings via Stripe. In your Stripe dashboard, create a Connect platform and register this OAuth redirect URI: ${callbackUrl} — then add a webhook endpoint at ${webhookUrl} and paste its signing secret below. After you save the four values here, each owner connects their own Stripe account from the Apps page inside Cal.diy.',
        { callbackUrl, webhookUrl },
      ),
      warning: i18n(
        'Stripe must reach Cal.diy over the public internet. Your primary URL is ${url} — if that is a .local, LAN, or Tor (.onion) address, Stripe OAuth and webhooks will not work; add a custom domain and set it as your primary URL first. Saving restarts Cal.diy.',
        { url },
      ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  inputSpec,

  async ({ effects }) => ({
    stripe: (await storeJson.read((s) => s.stripe).once()) ?? undefined,
  }),

  // The web daemon reads store.stripe reactively and restarts; on the next boot
  // main.ts emits the Stripe env vars (only when selection === 'enabled') and
  // cal's seed-app-store.ts seeds the app from them.
  async ({ effects, input }) =>
    storeJson.merge(effects, { stripe: input.stripe }),
)
