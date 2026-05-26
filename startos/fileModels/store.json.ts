import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  postgresPassword: z.string().optional().catch(undefined),
  nextAuthSecret: z.string().optional().catch(undefined),
  calendsoEncryptionKey: z.string().optional().catch(undefined),
  url: z.string().optional().catch(undefined),
  smtp: smtpShape,
  signupDisabled: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
