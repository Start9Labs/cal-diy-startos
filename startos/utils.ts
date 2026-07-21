import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3000
export const postgresPort = 5432
export const postgresUser = 'calcom'
export const postgresDb = 'calendso'

// Host id (the `sdk.MultiHost.of` group) vs. the interface id exported on it —
// they differ here, so keep both for `sdk.host.getOwn` lookups.
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'

// Hardcoded in the upstream calcom/cal.com:v6.2.0 image at build time.
// Cal's start.sh runs replace-placeholder.sh to rewrite static .next/ assets
// from this value to whatever NEXT_PUBLIC_WEBAPP_URL is set at runtime.
export const builtWebappUrl = 'http://localhost:3000'

export async function getNonLocalUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, uiHostId, (host) => {
      const iface = Object.values(host?.bindings ?? {})
        .flatMap((b) => Object.values(b.interfaces))
        .find((i) => i.id === uiInterfaceId)
      return iface?.addressInfo.nonLocal.format() || []
    })
    .const()
}
