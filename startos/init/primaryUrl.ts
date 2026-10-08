import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { primaryUrl } from '../primaryUrl'
import { sdk } from '../sdk'

export const seedPrimaryUrl = sdk.setupOnInit(async (effects) => {
  if (await storeJson.read((s) => s.url).const(effects)) return
  const url = await primaryUrl.bestUsable(effects).const()
  if (url) {
    await storeJson.merge(effects, { url }, { allowWriteAfterConst: true })
  }
})

export const taskPrimaryUrl = primaryUrl.setupTask('critical', {
  reason: i18n('Primary URL is no longer available. Select a new one.'),
})
