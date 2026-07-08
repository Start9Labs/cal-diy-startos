import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    const postgresPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 22,
    })
    const nextAuthSecret = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 44,
    })
    const calendsoEncryptionKey = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })
    const cronApiKey = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 44,
    })

    // Default-deny new account creation. Cal.diy's first-admin bootstrap at
    // /api/auth/setup is not gated by NEXT_PUBLIC_DISABLE_SIGNUP (it only
    // checks `userCount === 0`), so the user can still create the initial
    // admin on first launch. Subsequent users are added through Cal.diy's
    // admin console at /settings/admin/users/add — see the "Add a user"
    // guidance in the package instructions.
    await storeJson.merge(effects, {
      postgresPassword,
      nextAuthSecret,
      calendsoEncryptionKey,
      cronApiKey,
      smtp: { selection: 'disabled', value: {} },
      stripe: { selection: 'disabled' },
      signupDisabled: true,
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
