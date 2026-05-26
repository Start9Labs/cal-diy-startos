import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  internalWebappUrl,
  postgresDb,
  postgresPort,
  postgresUser,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cal.diy!'))

  const store = await storeJson.read((s) => s).const(effects)
  const postgresPassword = store?.postgresPassword ?? ''
  const nextAuthSecret = store?.nextAuthSecret ?? ''
  const calendsoEncryptionKey = store?.calendsoEncryptionKey ?? ''

  const postgresSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/postgresql',
      readonly: false,
    }),
    'postgres-sub',
  )

  const appSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'main' },
    sdk.Mounts.of(),
    'cal-diy-sub',
  )

  const databaseUrl = `postgresql://${postgresUser}:${postgresPassword}@127.0.0.1:${postgresPort}/${postgresDb}`

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
        env: {
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DB: postgresDb,
        },
      },
      ready: {
        display: i18n('Database'),
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            'pg_isready',
            '-U',
            postgresUser,
            '-d',
            postgresDb,
            '-h',
            '127.0.0.1',
          ])

          if (exitCode !== 0) {
            return {
              result: 'loading',
              message: i18n('Waiting for PostgreSQL to be ready'),
            }
          }
          return {
            result: 'success',
            message: i18n('PostgreSQL is ready'),
          }
        },
      },
      requires: [],
    })
    .addDaemon('cal-diy', {
      subcontainer: appSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          DATABASE_URL: databaseUrl,
          DATABASE_DIRECT_URL: databaseUrl,
          DATABASE_HOST: `127.0.0.1:${postgresPort}`,
          NEXTAUTH_SECRET: nextAuthSecret,
          NEXTAUTH_URL: internalWebappUrl,
          CALENDSO_ENCRYPTION_KEY: calendsoEncryptionKey,
          NEXT_PUBLIC_WEBAPP_URL: internalWebappUrl,
          NEXT_PUBLIC_WEBSITE_URL: internalWebappUrl,
          BUILT_NEXT_PUBLIC_WEBAPP_URL: internalWebappUrl,
          CALCOM_TELEMETRY_DISABLED: '1',
          NEXT_TELEMETRY_DISABLED: '1',
          NODE_ENV: 'production',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 180000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Cal.diy is ready'),
            errorMessage: i18n('Cal.diy is not ready'),
          }),
      },
      requires: ['postgres'],
    })
})
