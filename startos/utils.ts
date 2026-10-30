import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3000
export const postgresPort = 5432
export const postgresUser = 'calcom'
export const postgresDb = 'calendso'

// Host id (the `sdk.MultiHost.of` group) vs. the interface id exported on it —
// they differ here, and `setupPrimaryUrl` needs both.
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'

// Hardcoded in the upstream calcom/cal.com:v6.2.0 image at build time.
// Cal's start.sh runs replace-placeholder.sh to rewrite static .next/ assets
// from this value to whatever NEXT_PUBLIC_WEBAPP_URL is set at runtime.
export const builtWebappUrl = 'http://localhost:3000'

export function postgresSub(effects: T.Effects, name: string) {
  return sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/postgresql',
      readonly: false,
    }),
    name,
  )
}

export function postgresEnv(password: string) {
  return {
    POSTGRES_USER: postgresUser,
    POSTGRES_PASSWORD: password,
    POSTGRES_DB: postgresDb,
  }
}

export const pgIsReady = [
  'pg_isready',
  '-U',
  postgresUser,
  '-d',
  postgresDb,
  '-h',
  '127.0.0.1',
]

export function databaseEnv(password: string) {
  const url = `postgresql://${postgresUser}:${password}@127.0.0.1:${postgresPort}/${postgresDb}`
  return { DATABASE_URL: url, DATABASE_DIRECT_URL: url }
}
