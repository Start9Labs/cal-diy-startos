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

    await storeJson.merge(effects, {
      postgresPassword,
      nextAuthSecret,
      calendsoEncryptionKey,
      smtp: { selection: 'disabled', value: {} },
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
