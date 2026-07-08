import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  postgresPassword: z.string().optional().catch(undefined),
  nextAuthSecret: z.string().optional().catch(undefined),
  calendsoEncryptionKey: z.string().optional().catch(undefined),
  cronApiKey: z.string().optional().catch(undefined),
  url: z.string().optional().catch(undefined),
  smtp: smtpShape,
  signupDisabled: z.boolean().catch(false),
  // Platform Stripe credentials for paid bookings (a disabled/enabled union,
  // mirroring the manage-stripe action). When enabled, main.ts maps value.* to
  // the NEXT_PUBLIC_STRIPE_PUBLIC_KEY / STRIPE_PRIVATE_KEY / STRIPE_CLIENT_ID /
  // STRIPE_WEBHOOK_SECRET env vars cal's seed-app-store.ts reads at boot.
  stripe: z
    .discriminatedUnion('selection', [
      z.object({ selection: z.literal('disabled') }),
      z.object({
        selection: z.literal('enabled'),
        value: z.object({
          publishableKey: z.string(),
          secretKey: z.string(),
          connectClientId: z.string(),
          webhookSecret: z.string(),
        }),
      }),
    ])
    .optional()
    .catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
