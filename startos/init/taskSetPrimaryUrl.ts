import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getNonLocalUrls } from '../utils'

export const taskSetPrimaryUrl = sdk.setupOnInit(async (effects) => {
  const availableUrls = await getNonLocalUrls(effects)
  const url = await storeJson.read((s) => s.url).const(effects)

  if (!url) {
    const fallback =
      availableUrls.find((u) => u.includes('.local')) ?? availableUrls[0]
    if (fallback) {
      await storeJson.merge(
        effects,
        { url: fallback },
        { allowWriteAfterConst: true },
      )
    }
  } else if (!availableUrls.includes(url)) {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'critical', {
      reason: i18n('Primary URL is no longer available. Select a new one.'),
    })
  }
})
