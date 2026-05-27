import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3000
export const postgresPort = 5432
export const postgresUser = 'calcom'
export const postgresDb = 'calendso'

// Hardcoded in the upstream calcom/cal.com:v6.2.0 image at build time.
// Cal's start.sh runs replace-placeholder.sh to rewrite static .next/ assets
// from this value to whatever NEXT_PUBLIC_WEBAPP_URL is set at runtime.
export const builtWebappUrl = 'http://localhost:3000'

export async function getNonLocalUrls(effects: T.Effects): Promise<string[]> {
  return sdk.serviceInterface
    .getOwn(effects, 'ui', (i) => i?.addressInfo?.nonLocal.format() || [])
    .const()
}
